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

  try {
    const document = await prisma.document.findUnique({ where: { id: documentId } });
    if (!document) {
      throw new Error(`Document ${documentId} not found`);
    }

    // 1. Download & Extract
    await updateDocumentProcessingStatus(documentId, DocumentStatus.PROCESSING, 'extraction.started');
    const tempFilePath = `${process.cwd()}/tmp-${documentId}-${Date.now()}`;
    await downloadFile(document.path, tempFilePath);
    const fileBuffer = await import('fs/promises').then((fs) => fs.readFile(tempFilePath));

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

    // 4. Store in PostgreSQL
    await prisma.$transaction(async (tx) => {
      for (const item of chromaItems) {
        await tx.documentChunk.create({
          data: {
            content: item.document,
            chunkIndex: item.metadata.chunkIndex,
            tokenCount: Math.max(1, Math.ceil(item.document.length / 4)),
            metadata: item.metadata,
            documentId,
          },
        });
      }
    });

    // 5. Store in ChromaDB
    if (chromaItems.length > 0) {
      await collection.add({
        ids: chromaItems.map((item) => item.id),
        embeddings: chromaItems.map((item) => item.embedding),
        metadatas: chromaItems.map((item) => item.metadata),
        documents: chromaItems.map((item) => item.document),
      });
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
        pageCount: Math.max(...chunks.map(c => c.metadata.pageNumber || 1)),
        summary: `Processed ${filename} - ${chunks.length} chunks (${duplicateCount} near-duplicates)`,
        metadata: {
          ...(document.metadata as Record<string, unknown> | null),
          processing: { status: 'completed', path, bucket, ownerId, duplicateCount, chunkCount: chunks.length },
        },
      },
    });

    await import('fs/promises').then((fs) => fs.unlink(tempFilePath).catch(() => undefined));

    logger.info('Document processing completed', { documentId, projectId, chunkCount: chunks.length, duplicateCount });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown processing error';
    await updateDocumentProcessingStatus(documentId, DocumentStatus.FAILED, message);
    logger.error('Document processing failed', { documentId, error: message });
    throw error;
  }
}
