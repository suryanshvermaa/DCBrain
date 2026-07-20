import os from 'os';
import { Job } from 'bullmq';
import { DocumentStatus } from '@prisma/client';
import { logger } from '@/lib/logger';
import { updateDocumentProcessingStatus } from './workerService';
import { splitTextIntoChunks } from './chunker';
import { getOrCreateCollection } from '@/lib/chroma';
import prisma from '@/lib/prisma';
import config from '@/core/config';
import { downloadFile } from '@/lib/minio';
import { extractDocumentText } from './extractors';
import { generateEmbeddings } from './embedder';
import { extractAndStoreEntities } from './entityExtractor';

export interface ProcessDocumentJobData {
  documentId: string;
  projectId: string;
  filename: string;
  mimeType: string;
  bucket: string;
  path: string;
  ownerId: string;
}

const DUPLICATE_DISTANCE_THRESHOLD = 0.1; // L2 distance threshold for near-duplicates

export async function processDocumentJob(job: Job<ProcessDocumentJobData>): Promise<void> {
  const { documentId, projectId, filename, mimeType, path, bucket, ownerId } = job.data;

  let tempFilePath: string | undefined;

  try {
    const document = await prisma.document.findUnique({ where: { id: documentId } });
    if (!document) {
      throw new Error(`Document ${documentId} not found`);
    }

    // 1. Download & Extract
    await updateDocumentProcessingStatus(documentId, DocumentStatus.PROCESSING, 'extraction.started');

    // Idempotency: a retry (BullMQ attempts:3) must start from a clean slate,
    // otherwise chunks would be double-inserted. Remove any chunks left behind
    // by a previous partial run in both PostgreSQL and ChromaDB.
    await prisma.documentChunk.deleteMany({ where: { documentId } });
    try {
      const staleCollection = await getOrCreateCollection(projectId);
      await staleCollection.delete({ where: { documentId } });
    } catch (e) {
      logger.warn('Chroma cleanup of prior chunks failed (may be empty collection)', { documentId, error: e });
    }

    tempFilePath = `${os.tmpdir()}/tmp-${documentId}-${Date.now()}`;
    await downloadFile(document.path, tempFilePath);
    const fileBuffer = await import('fs/promises').then((fs) => fs.readFile(tempFilePath as string));

    const extracted = await extractDocumentText(fileBuffer, filename, mimeType);
    const rawText = extracted.text;

    // 2. Chunking
    await updateDocumentProcessingStatus(documentId, DocumentStatus.PROCESSING, 'chunking.started');
    const chunks = splitTextIntoChunks(rawText, {
      chunkSize: config.CHUNK_SIZE,
      chunkOverlap: config.CHUNK_OVERLAP,
      sectionHeader: filename,
      documentId,
    });

    // 3. Embeddings & Duplicate Detection
    await updateDocumentProcessingStatus(documentId, DocumentStatus.PROCESSING, 'embedding.started');
    const chunkContents = chunks.map(c => c.content);
    
    // Generate embeddings in batches if necessary, here we do it in one go assuming reasonable size
    const batchSize = Number(config.EMBEDDING_BATCH_SIZE || 100);
    const chunkEmbeddings: number[][] = [];
    
    for (let i = 0; i < chunkContents.length; i += batchSize) {
      const batch = chunkContents.slice(i, i + batchSize);
      const batchEmbeddings = await generateEmbeddings(batch);
      chunkEmbeddings.push(...batchEmbeddings);
    }

    const collection = await getOrCreateCollection(projectId);
    
    let duplicateCount = 0;
    const chromaItems: Array<{ id: string; metadata: any; document: string; embedding: number[] }> = [];

    // Check duplicates and prepare ChromaDB items
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      if (!chunk) continue;
      const embedding = chunkEmbeddings[i];
      if (!embedding) continue;
      
      let isDuplicate = false;
      try {
        const queryResult = await collection.query({
          queryEmbeddings: [embedding],
          nResults: 1
        });
        
        if (queryResult.distances && queryResult.distances[0] && queryResult.distances[0][0] !== undefined && queryResult.distances[0][0] < DUPLICATE_DISTANCE_THRESHOLD) {
          isDuplicate = true;
          duplicateCount++;
        }
      } catch (e) {
        logger.warn('Chroma query failed during duplicate check (might be empty collection)', { error: e });
      }
      
      const chunkMetadata = {
        documentId,
        projectId,
        sectionHeader: chunk.metadata.sectionHeader || '',
        pageNumber: chunk.metadata.pageNumber || 1,
        chunkIndex: chunk.metadata.chunkIndex,
        source: extracted.metadata.format,
        isDuplicate,
      };

      chromaItems.push({
        id: `${documentId}-${chunk.metadata.chunkIndex}`,
        metadata: chunkMetadata,
        document: chunk.content,
        embedding,
      });

      // Save duplicate flag back to local object for postgres
      (chunk.metadata as any).isDuplicate = isDuplicate;
    }

    // 4. Store in PostgreSQL (capture generated ids so ChromaDB can reuse them
    //    as its own ids — this unifies the chunk identifier across both stores
    //    so Reciprocal Rank Fusion can merge the same chunk from both legs).
    //    Using upsert ensures idempotency across job retries without duplicate errors.
    const pgChunkIds: string[] = await prisma.$transaction(async (tx) => {
      const ids: string[] = [];
      for (const item of chromaItems) {
        const created = await tx.documentChunk.upsert({
          where: {
            documentId_chunkIndex: {
              documentId,
              chunkIndex: item.metadata.chunkIndex,
            },
          },
          update: {
            content: item.document,
            tokenCount: Math.max(1, Math.ceil(item.document.length / 4)),
            metadata: item.metadata as any,
          },
          create: {
            content: item.document,
            chunkIndex: item.metadata.chunkIndex,
            tokenCount: Math.max(1, Math.ceil(item.document.length / 4)),
            metadata: item.metadata as any,
            documentId,
          },
          select: { id: true },
        });
        ids.push(created.id);
      }
      return ids;
    });

    // 5. Store in ChromaDB using the PostgreSQL chunk ids. If this fails, roll
    //    back the just-inserted PG rows so a retry starts from a clean state
    //    (semantic search would otherwise never surface these orphaned rows).
    if (chromaItems.length > 0) {
      try {
        await collection.delete({ where: { documentId } }).catch(() => undefined);
        await collection.add({
          ids: pgChunkIds,
          embeddings: chromaItems.map((item) => item.embedding),
          metadatas: chromaItems.map((item) => item.metadata),
          documents: chromaItems.map((item) => item.document),
        });
      } catch (chromaErr) {
        await prisma.documentChunk.deleteMany({ where: { documentId } });
        throw chromaErr;
      }
    }

    // 6. Entity Extraction to Neo4j
    await updateDocumentProcessingStatus(documentId, DocumentStatus.PROCESSING, 'entity_extraction.started');
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      if (!chunk) continue;
      // Skip deep entity extraction if it's an exact duplicate to save tokens/time
      if (!(chunk.metadata as any).isDuplicate) {
        await extractAndStoreEntities(chunk.content, documentId, projectId, chunk.metadata.chunkIndex);
      }
    }

    // 7. Finalize
    await prisma.document.update({
      where: { id: documentId },
      data: {
        status: DocumentStatus.PROCESSED,
        processedAt: new Date(),
        completedAt: new Date(),
        extractedText: rawText,
        pageCount: chunks.length ? Math.max(...chunks.map((c) => c.metadata.pageNumber || 1)) : 1,
        summary: `Processed ${filename} - ${chunks.length} chunks (${duplicateCount} near-duplicates)`,
        metadata: {
          ...(document.metadata as Record<string, unknown> | null),
          processing: { status: 'completed', path, bucket, ownerId, duplicateCount, chunkCount: chunks.length },
        },
      },
    });

    logger.info('Document processing completed', { documentId, projectId, chunkCount: chunks.length, duplicateCount });

    // Invalidate stale cached search answers now that new content is searchable.
    try {
      const { invalidateProjectSearchCache } = await import('../../rag/pipeline.js');
      await invalidateProjectSearchCache(projectId);
    } catch (cacheErr) {
      logger.warn('Failed to invalidate search cache after processing', { projectId, error: cacheErr });
    }

    try {
      const { createNotification } = await import('../../notifications/index.js');
      await createNotification({
        userId: ownerId,
        type: 'DOCUMENT_READY',
        title: 'Document Processed',
        message: `Your document "${filename}" has been processed successfully.`,
        link: '/documents',
        data: { projectId, documentId },
      });
    } catch (notifErr) {
      logger.error('Failed to send success notification for document', { error: notifErr });
    }

    const { triggerAgentsOnEvent } = await import('../../agents/triggers.js');
    await triggerAgentsOnEvent('document_processed', projectId, ownerId, { documentId });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown processing error';
    await updateDocumentProcessingStatus(documentId, DocumentStatus.FAILED, message);

    try {
      const { createNotification } = await import('../../notifications/index.js');
      await createNotification({
        userId: ownerId,
        type: 'ERROR',
        title: 'Document Processing Failed',
        message: `Processing failed for document "${filename}".`,
        link: '/documents',
        data: { projectId, documentId, error: message },
      });
    } catch (notifErr) {
      logger.error('Failed to send fail notification for document', { error: notifErr });
    }

    logger.error('Document processing failed', { documentId, error: message });
    throw error;
  } finally {
    if (tempFilePath) {
      await import('fs/promises').then((fs) => fs.unlink(tempFilePath as string).catch(() => undefined));
    }
  }
}
