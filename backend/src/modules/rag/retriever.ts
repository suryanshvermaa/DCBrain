import { logger } from '@/lib/logger';
import { getOrCreateCollection } from '@/lib/chroma';
import prisma from '@/lib/prisma';
import { generateEmbeddings } from '@/modules/documents/processing/embedder';
import type { SearchFilters, SemanticResult, KeywordResult } from './types';

const DEFAULT_TOP_K = 10;

/**
 * Embed the user query using the same OpenAI text-embedding-3-small model used during document ingestion.
 */
export async function embedQuery(query: string): Promise<number[]> {
  const [embedding] = await generateEmbeddings([query]);
  if (!embedding) {
    throw new Error('Failed to generate query embedding');
  }
  return embedding;
}

/**
 * Semantic search against the project's ChromaDB collection.
 * Returns up to `topK` results ordered by ascending L2 distance (lower = better).
 */
export async function semanticSearch(
  projectId: string,
  queryEmbedding: number[],
  topK: number = DEFAULT_TOP_K,
  filters?: SearchFilters
): Promise<SemanticResult[]> {
  try {
    const collection = await getOrCreateCollection(projectId);

    // Build ChromaDB `where` clause from filters
    const where: Record<string, unknown> = { projectId };
    if (filters?.category) {
      // documents are stored with category in metadata via the processing worker
    }
    if (filters?.documentIds && filters.documentIds.length > 0) {
      where['documentId'] = { $in: filters.documentIds };
    }

    const queryResult = await collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: topK,
      where: Object.keys(where).length > 1 ? where : { projectId },
    });

    const ids = queryResult.ids?.[0] ?? [];
    const distances = queryResult.distances?.[0] ?? [];
    const metadatas = queryResult.metadatas?.[0] ?? [];
    const documents = queryResult.documents?.[0] ?? [];

    return ids.map((id, index) => ({
      chunkId: String(id),
      documentId: String((metadatas[index] as Record<string, unknown>)?.['documentId'] ?? ''),
      projectId,
      content: String(documents[index] ?? ''),
      score: distances[index] ?? 1,
      metadata: (metadatas[index] as Record<string, unknown>) ?? {},
    }));
  } catch (error) {
    logger.warn('Semantic search failed', { projectId, error });
    return [];
  }
}

/**
 * Full-text keyword search on `document_chunks.content` using PostgreSQL `plainto_tsquery`.
 * Uses ts_rank for BM25-style scoring.
 */
export async function keywordSearch(
  projectId: string,
  query: string,
  topK: number = DEFAULT_TOP_K,
  filters?: SearchFilters
): Promise<KeywordResult[]> {
  try {
    // Build dynamic WHERE clauses
    const extraConditions: string[] = [];
    const params: unknown[] = [query, projectId, topK];

    if (filters?.category) {
      params.push(filters.category);
      extraConditions.push(`d.category = $${params.length}`);
    }

    if (filters?.documentIds && filters.documentIds.length > 0) {
      params.push(filters.documentIds);
      extraConditions.push(`dc."documentId" = ANY($${params.length}::text[])`);
    }

    if (filters?.dateFrom) {
      params.push(new Date(filters.dateFrom));
      extraConditions.push(`d."uploadedAt" >= $${params.length}`);
    }

    if (filters?.dateTo) {
      params.push(new Date(filters.dateTo));
      extraConditions.push(`d."uploadedAt" <= $${params.length}`);
    }

    const extraWhere = extraConditions.length > 0 ? `AND ${extraConditions.join(' AND ')}` : '';

    const rows = await prisma.$queryRawUnsafe<
      Array<{
        id: string;
        documentId: string;
        content: string;
        rank: number;
        metadata: unknown;
        chunkIndex: number;
      }>
    >(
      `
      SELECT
        dc.id,
        dc."documentId",
        dc.content,
        dc."chunkIndex",
        dc.metadata,
        ts_rank(to_tsvector('english', dc.content), plainto_tsquery('english', $1)) AS rank
      FROM document_chunks dc
      JOIN documents d ON d.id = dc."documentId"
      WHERE
        d."projectId" = $2
        AND d."deletedAt" IS NULL
        AND to_tsvector('english', dc.content) @@ plainto_tsquery('english', $1)
        ${extraWhere}
      ORDER BY rank DESC
      LIMIT $3
      `,
      ...params
    );

    return rows.map((row) => ({
      chunkId: row.id,
      documentId: row.documentId,
      content: row.content,
      score: Number(row.rank),
      metadata: (row.metadata as Record<string, unknown>) ?? {},
    }));
  } catch (error) {
    logger.warn('Keyword search failed', { projectId, error });
    return [];
  }
}
