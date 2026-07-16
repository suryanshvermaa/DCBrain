import { getApiClient } from '@/lib/api';

export type CommissioningStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'PASSED' | 'FAILED' | 'CLOSED';

export interface CxResponse {
  id: string;
  testRef: string | null;
  systemName: string;
  discipline: string | null;
  status: CommissioningStatus;
  procedure: string | null;
  result: string | null;
  testedBy: string | null;
  completedDate: string | null;
  documentId: string | null;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CxSummaryResponse {
  total: number;
  byStatus: Record<CommissioningStatus, number>;
  passRate: number;
  pendingCount: number;
  byDiscipline: Record<string, number>;
}

const api = getApiClient();

export async function listCommissioning(
  projectId: string,
  filters?: { status?: CommissioningStatus; discipline?: string; limit?: number; offset?: number }
): Promise<{ records: CxResponse[]; total: number }> {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.discipline) params.append('discipline', filters.discipline);
  if (filters?.limit) params.append('limit', String(filters.limit));
  if (filters?.offset) params.append('offset', String(filters.offset));
  const query = params.toString() ? `?${params.toString()}` : '';
  return api.get<{ records: CxResponse[]; total: number }>(`/api/v1/projects/${projectId}/commissioning${query}`);
}

export async function getCommissioning(projectId: string, cxId: string): Promise<CxResponse> {
  return api.get<CxResponse>(`/api/v1/projects/${projectId}/commissioning/${cxId}`);
}

export async function createCommissioning(
  projectId: string,
  data: { systemName: string; testRef?: string; discipline?: string; procedure?: string; testedBy?: string; documentId?: string }
): Promise<CxResponse> {
  return api.post<CxResponse>(`/api/v1/projects/${projectId}/commissioning`, data);
}

export async function updateCommissioning(
  projectId: string,
  cxId: string,
  data: Partial<{ systemName: string; status: CommissioningStatus; result: string; completedDate: string; testedBy: string }>
): Promise<CxResponse> {
  return api.put<CxResponse>(`/api/v1/projects/${projectId}/commissioning/${cxId}`, data);
}

export async function getCommissioningSummary(projectId: string): Promise<CxSummaryResponse> {
  return api.get<CxSummaryResponse>(`/api/v1/projects/${projectId}/commissioning/summary`);
}
