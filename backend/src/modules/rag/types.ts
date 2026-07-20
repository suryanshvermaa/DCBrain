/**
 * Shared TypeScript interfaces for the RAG search pipeline.
 */

export interface SearchFilters {
  /** Filter by document category (e.g. "design", "compliance") */
  category?: string;
  /** ISO date string — only include chunks from documents uploaded after this date */
  dateFrom?: string;
  /** ISO date string — only include chunks from documents uploaded before this date */
  dateTo?: string;
  /** Restrict search to specific document IDs */
  documentIds?: string[];
  /** Max results to retrieve per search leg (default 10) */
  topK?: number;
}

/** A single result from ChromaDB semantic search */
export interface SemanticResult {
  chunkId: string;
  documentId: string;
  projectId: string;
  content: string;
  score: number; // lower = more similar (L2 distance)
  metadata: Record<string, unknown>;
}

/** A single result from PostgreSQL full-text keyword search */
export interface KeywordResult {
  chunkId: string;
  documentId: string;
  content: string;
  score: number; // ts_rank score
  metadata: Record<string, unknown>;
}

/** A chunk after Reciprocal Rank Fusion */
export interface FusedResult {
  chunkId: string;
  documentId: string;
  content: string;
  rrfScore: number;
  semanticRank: number | null;
  keywordRank: number | null;
  metadata: Record<string, unknown>;
}

/** A source citation returned to the client */
export interface SourceCitation {
  documentId: string;
  documentName: string;
  pageNumber: number;
  chunkIndex: number;
  relevanceScore: number;
  excerpt: string;
}

/** The generated AI answer */
export interface GeneratedAnswer {
  answer: string;
  confidence: number; // 0–1
  sources: SourceCitation[];
  noResults: boolean;
  /** True when the answer is an error placeholder (e.g. LLM outage) and must not be cached. */
  error?: boolean;
}

/** Full pipeline response returned by the search endpoint */
export interface RagResponse {
  query: string;
  answer: string;
  confidence: number;
  sources: SourceCitation[];
  cached: boolean;
  resultCount: number;
  processingMs: number;
}

/** Input to the RAG pipeline orchestrator */
export interface RagPipelineInput {
  projectId: string;
  userId: string;
  query: string;
  filters?: SearchFilters;
}
