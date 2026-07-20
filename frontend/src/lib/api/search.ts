import { getApiClient } from '@/lib/api';

const api = getApiClient();

// ── Types ───────────────────────────────────────────────────────────────────

export interface SearchFilters {
  category?: string;
  dateFrom?: string;
  dateTo?: string;
  documentIds?: string[];
  topK?: number;
}

export interface SearchRequest {
  query: string;
  filters?: SearchFilters;
}

export interface SourceCitation {
  documentId: string;
  documentName: string;
  pageNumber: number;
  chunkIndex: number;
  relevanceScore: number;
  excerpt: string;
}

export interface SearchResponse {
  query: string;
  answer: string;
  confidence: number;
  sources: SourceCitation[];
  cached: boolean;
  resultCount: number;
  processingMs: number;
}

export interface SearchHistoryItem {
  id: string;
  query: string;
  resultCount: number;
  createdAt: string;
}

export interface SearchHistoryResponse {
  history: SearchHistoryItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// ── API calls ───────────────────────────────────────────────────────────────

export async function searchProject(
  projectId: string,
  request: SearchRequest
): Promise<SearchResponse> {
  return api.post<SearchResponse>(`/api/v1/projects/${projectId}/search`, request);
}

export async function getSearchHistory(
  projectId: string,
  page = 1,
  pageSize = 20
): Promise<SearchHistoryResponse> {
  return api.get<SearchHistoryResponse>(
    `/api/v1/projects/${projectId}/search/history?page=${page}&pageSize=${pageSize}`
  );
}

export async function deleteSearchHistoryItem(
  projectId: string,
  historyId: string
): Promise<{ success: boolean }> {
  return api.delete<{ success: boolean }>(
    `/api/v1/projects/${projectId}/search/history/${historyId}`
  );
}
