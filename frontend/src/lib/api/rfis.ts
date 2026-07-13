import { getApiClient } from '@/lib/api';

export interface RfiSource {
  documentId: string;
  documentName: string;
  excerpt: string;
  relevanceScore: number;
}

export interface RfiDocumentLink {
  documentId: string;
  filename: string;
  originalName: string;
}

export interface RfiResponse {
  id: string;
  number: string;
  subject: string;
  question: string;
  status: 'OPEN' | 'IN_REVIEW' | 'ANSWERED' | 'CLOSED' | 'VOID';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  discipline: string | null;
  dueDate: string | null;
  resolution: string | null;
  suggestedAnswer: string | null;
  suggestedSources: RfiSource[];
  suggestedAt: string | null;
  answeredAt: string | null;
  closedAt: string | null;
  ageDays: number;
  overdue: boolean;
  raisedBy: { id: string; name: string } | null;
  assignee: { id: string; name: string } | null;
  answeredBy: { id: string; name: string } | null;
  documents: RfiDocumentLink[];
  createdAt: string;
  updatedAt: string;
}

export interface RfiAnalyticsResponse {
  total: number;
  byStatus: Record<'OPEN' | 'IN_REVIEW' | 'ANSWERED' | 'CLOSED' | 'VOID', number>;
  open: number;
  overdue: number;
  avgResolutionDays: number | null;
  ageingBuckets: Record<'0-7' | '8-14' | '15-30' | '30+', number>;
}

const api = getApiClient();

export async function listRfis(
  projectId: string,
  filters?: {
    status?: string;
    overdue?: boolean;
    assigneeId?: string;
    limit?: number;
    offset?: number;
  }
): Promise<{ rfis: RfiResponse[]; total: number }> {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.overdue !== undefined) params.append('overdue', String(filters.overdue));
  if (filters?.assigneeId) params.append('assigneeId', filters.assigneeId);
  if (filters?.limit) params.append('limit', String(filters.limit));
  if (filters?.offset) params.append('offset', String(filters.offset));

  const query = params.toString() ? `?${params.toString()}` : '';
  return api.get<{ rfis: RfiResponse[]; total: number }>(
    `/api/v1/projects/${projectId}/rfis${query}`
  );
}

export async function getRfi(projectId: string, rfiId: string): Promise<RfiResponse> {
  return api.get<RfiResponse>(`/api/v1/projects/${projectId}/rfis/${rfiId}`);
}

export async function createRfi(
  projectId: string,
  data: {
    subject: string;
    question: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    discipline?: string;
    dueDate?: string | null;
    assigneeId?: string | null;
    documentIds?: string[];
  }
): Promise<RfiResponse> {
  return api.post<RfiResponse>(`/api/v1/projects/${projectId}/rfis`, data);
}

export async function updateRfi(
  projectId: string,
  rfiId: string,
  data: Partial<{
    subject: string;
    question: string;
    status: 'OPEN' | 'IN_REVIEW' | 'ANSWERED' | 'CLOSED' | 'VOID';
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    discipline: string | null;
    dueDate: string | null;
    assigneeId: string | null;
    resolution: string | null;
    documentIds: string[];
  }>
): Promise<RfiResponse> {
  return api.put<RfiResponse>(`/api/v1/projects/${projectId}/rfis/${rfiId}`, data);
}

export async function suggestRfiAnswer(projectId: string, rfiId: string): Promise<RfiResponse> {
  return api.post<RfiResponse>(`/api/v1/projects/${projectId}/rfis/${rfiId}/suggest-answer`, {});
}

export async function getRfiAnalytics(projectId: string): Promise<RfiAnalyticsResponse> {
  return api.get<RfiAnalyticsResponse>(`/api/v1/projects/${projectId}/rfis/analytics`);
}
