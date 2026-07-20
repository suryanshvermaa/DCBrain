import crypto from 'crypto';
import { redis } from '@/lib/redis';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { embedQuery, semanticSearch, keywordSearch } from './retriever';
import { reciprocalRankFusion } from './fusion';
import { generateAnswer } from './generator';
import type { RagPipelineInput, RagResponse } from './types';

const CACHE_TTL_SECONDS = 3600; // 1 hour

/** Redis set holding every live cache key for a project, so all can be invalidated on ingestion. */
function getCacheIndexKey(projectId: string): string {
  return `search:index:${projectId}`;
}

/** Deterministic cache key from projectId + query + serialised filters */
function getCacheKey(input: RagPipelineInput): string {
  const payload = JSON.stringify({
    projectId: input.projectId,
    query: input.query.trim().toLowerCase(),
    filters: input.filters ?? {},
  });
  return `search:${input.projectId}:${crypto.createHash('sha256').update(payload).digest('hex')}`;
}

/**
 * Invalidate every cached answer for a project. Call after any event that
 * changes what documents/data a search could return (document processed,
 * procurement import, schedule import) so stale "no documents found" answers
 * don't linger for up to an hour.
 */
export async function invalidateProjectSearchCache(projectId: string): Promise<void> {
  try {
    const indexKey = getCacheIndexKey(projectId);
    const keys = await redis.smembers(indexKey);
    if (keys.length > 0) {
      await redis.unlink(...keys);
    }
    await redis.unlink(indexKey);
  } catch (err) {
    logger.warn('Failed to invalidate project search cache', { projectId, err });
  }
}

/**
 * Full RAG pipeline:
 *   1. Check Redis cache
 *   2. Embed query
 *   3. Semantic search (ChromaDB)
 *   4. Keyword search  (PostgreSQL pg_tsvector)
 *   5. Reciprocal Rank Fusion
 *   6. Generate answer (Gemini 2.5 Flash)
 *   7. Write to Redis cache
 *   8. Persist search history
 */
export async function runRagPipeline(input: RagPipelineInput): Promise<RagResponse> {
  const startMs = Date.now();
  const topK = input.filters?.topK ?? 10;
  const cacheKey = getCacheKey(input);

  // ── 1. Cache read ────────────────────────────────────────────────────────
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached) as RagResponse;
      logger.info('RAG cache hit', { projectId: input.projectId, cacheKey });
      // Persist history entry even for cache hits (don't await — non-critical)
      void persistSearchHistory(input, parsed.resultCount, true);
      return { ...parsed, cached: true, processingMs: Date.now() - startMs };
    }
  } catch (cacheErr) {
    logger.warn('Redis cache read failed, proceeding without cache', { cacheErr });
  }

  // ── 2. Embed query ───────────────────────────────────────────────────────
  const queryEmbedding = await embedQuery(input.query);

  // ── 3 & 4. Parallel search legs ──────────────────────────────────────────
  const [semanticResults, keywordResults] = await Promise.all([
    semanticSearch(input.projectId, queryEmbedding, topK, input.filters),
    keywordSearch(input.projectId, input.query, topK, input.filters),
  ]);

  logger.info('Search legs complete', {
    projectId: input.projectId,
    semanticCount: semanticResults.length,
    keywordCount: keywordResults.length,
  });

  // ── 5. Reciprocal Rank Fusion ─────────────────────────────────────────────
  const fusedResults = reciprocalRankFusion(semanticResults, keywordResults).slice(0, topK);

  // ── 6. Generate answer ───────────────────────────────────────────────────
  const generated = await generateAnswer(input.query, fusedResults);

  const response: RagResponse = {
    query: input.query,
    answer: generated.answer,
    confidence: generated.confidence,
    sources: generated.sources,
    cached: false,
    resultCount: fusedResults.length,
    processingMs: Date.now() - startMs,
  };

  // ── 7. Cache write ───────────────────────────────────────────────────────
  // Skip caching error placeholders (e.g. a transient Gemini outage) so a brief
  // failure doesn't poison the cache for an hour.
  if (!generated.error) {
    try {
      await redis.set(cacheKey, JSON.stringify(response), 'EX', CACHE_TTL_SECONDS);
      // Track the key so it can be invalidated when the project's data changes.
      const indexKey = getCacheIndexKey(input.projectId);
      await redis.sadd(indexKey, cacheKey);
      await redis.expire(indexKey, CACHE_TTL_SECONDS);
    } catch (cacheErr) {
      logger.warn('Redis cache write failed', { cacheErr });
    }
  }

  // ── 8. Persist history (non-critical) ────────────────────────────────────
  void persistSearchHistory(input, fusedResults.length, false);

  return response;
}

async function persistSearchHistory(
  input: RagPipelineInput,
  resultCount: number,
  cached: boolean
): Promise<void> {
  try {
    await prisma.searchHistory.create({
      data: {
        query: input.query,
        resultCount,
        cached,
        filters: (input.filters as any) ?? {},
        projectId: input.projectId,
        userId: input.userId,
      },
    });
  } catch (err) {
    logger.warn('Failed to persist search history', { err });
  }
}

/** List recent search history for a user+project (paginated) */
export async function listSearchHistory(
  projectId: string,
  userId: string,
  page: number,
  pageSize: number
): Promise<{ history: Array<{ id: string; query: string; resultCount: number; createdAt: string }>; total: number }> {
  const [records, total] = await Promise.all([
    prisma.searchHistory.findMany({
      where: { projectId, userId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: { id: true, query: true, resultCount: true, createdAt: true },
    }),
    prisma.searchHistory.count({ where: { projectId, userId } }),
  ]);

  return {
    history: records.map((r: any) => ({
      id: r.id,
      query: r.query,
      resultCount: r.resultCount,
      createdAt: r.createdAt.toISOString(),
    })),
    total,
  };
}

export async function deleteSearchHistoryItem(
  historyId: string,
  projectId: string,
  userId: string
): Promise<{ success: boolean }> {
  const item = await prisma.searchHistory.findFirst({
    where: { id: historyId, projectId, userId },
  });
  if (!item) {
    throw new Error('Search history item not found');
  }
  await prisma.searchHistory.delete({
    where: { id: historyId },
  });
  return { success: true };
}

