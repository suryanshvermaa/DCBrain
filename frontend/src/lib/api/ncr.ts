import { getApiClient } from '@/lib/api';

export type NcrSeverity = 'MINOR' | 'MAJOR' | 'CRITICAL';
export type NcrStatus = 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'CLOSED' | 'VOID';

export interface NcrResponse {
  id: string;
  number: string;
  title: string;
  description: string;
  severity: NcrSeverity;
  status: NcrStatus;
  discipline: string | null;
  rootCause: string | null;
  resolutionNote: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
  raisedById: string | null;
  documentId: string | null;
  rfiId: string | null;
  vendorId: string | null;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

export interface NcrAnalyticsResponse {
  total: number;
  byStatus: Record<NcrStatus, number>;
  bySeverity: Record<NcrSeverity, number>;
  open: number;
  resolved: number;
}

const api = getApiClient();

export async function listNcrs(
  projectId: string,
  filters?: { status?: NcrStatus; severity?: NcrSeverity; vendorId?: string; limit?: number; offset?: number }
): Promise<{ ncrs: NcrResponse[]; total: number }> {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.severity) params.append('severity', filters.severity);
  if (filters?.vendorId) params.append('vendorId', filters.vendorId);
  if (filters?.limit) params.append('limit', String(filters.limit));
  if (filters?.offset) params.append('offset', String(filters.offset));
  const query = params.toString() ? `?${params.toString()}` : '';
  return api.get<{ ncrs: NcrResponse[]; total: number }>(`/api/v1/projects/${projectId}/ncrs${query}`);
}

export async function getNcr(projectId: string, ncrId: string): Promise<NcrResponse> {
  return api.get<NcrResponse>(`/api/v1/projects/${projectId}/ncrs/${ncrId}`);
}

export async function createNcr(
  projectId: string,
  data: { title: string; description: string; severity?: NcrSeverity; discipline?: string; rootCause?: string; documentId?: string; rfiId?: string; vendorId?: string }
): Promise<NcrResponse> {
  return api.post<NcrResponse>(`/api/v1/projects/${projectId}/ncrs`, data);
}

export async function updateNcr(
  projectId: string,
  ncrId: string,
  data: Partial<{ title: string; description: string; severity: NcrSeverity; status: NcrStatus; discipline: string; rootCause: string; resolutionNote: string; vendorId: string }>
): Promise<NcrResponse> {
  return api.put<NcrResponse>(`/api/v1/projects/${projectId}/ncrs/${ncrId}`, data);
}

export async function getNcrAnalytics(projectId: string): Promise<NcrAnalyticsResponse> {
  return api.get<NcrAnalyticsResponse>(`/api/v1/projects/${projectId}/ncrs/analytics`);
}
