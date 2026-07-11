import type { SemanticResult, KeywordResult, FusedResult } from './types';

const DEFAULT_RRF_K = 60;

/**
 * Reciprocal Rank Fusion.
 *
 * For each chunk that appears in either (or both) result lists, computes:
 *   score = Σ  1 / (k + rank_i)
 * where rank_i is the 1-indexed position in that list (1 = best).
 *
 * Results are sorted descending by RRF score (higher = more relevant).
 */
export function reciprocalRankFusion(
  semanticResults: SemanticResult[],
  keywordResults: KeywordResult[],
  k: number = DEFAULT_RRF_K
): FusedResult[] {
  const scoreMap = new Map<
    string,
    {
      chunk: SemanticResult | KeywordResult;
      rrfScore: number;
      semanticRank: number | null;
      keywordRank: number | null;
    }
  >();

  // Process semantic results (rank 1 = lowest L2 distance = most similar)
  semanticResults.forEach((result, index) => {
    const rank = index + 1;
    const existing = scoreMap.get(result.chunkId);
    if (existing) {
      existing.rrfScore += 1 / (k + rank);
      existing.semanticRank = rank;
    } else {
      scoreMap.set(result.chunkId, {
        chunk: result,
        rrfScore: 1 / (k + rank),
        semanticRank: rank,
        keywordRank: null,
      });
    }
  });

  // Process keyword results (rank 1 = highest ts_rank = best keyword match)
  keywordResults.forEach((result, index) => {
    const rank = index + 1;
    const existing = scoreMap.get(result.chunkId);
    if (existing) {
      existing.rrfScore += 1 / (k + rank);
      existing.keywordRank = rank;
    } else {
      scoreMap.set(result.chunkId, {
        chunk: result,
        rrfScore: 1 / (k + rank),
        semanticRank: null,
        keywordRank: rank,
      });
    }
  });

  // Sort by descending RRF score and convert to FusedResult[]
  return Array.from(scoreMap.values())
    .sort((a, b) => b.rrfScore - a.rrfScore)
    .map(({ chunk, rrfScore, semanticRank, keywordRank }) => ({
      chunkId: chunk.chunkId,
      documentId: chunk.documentId,
      content: chunk.content,
      rrfScore,
      semanticRank,
      keywordRank,
      metadata: chunk.metadata,
    }));
}
