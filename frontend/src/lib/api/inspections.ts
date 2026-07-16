import { getApiClient } from '@/lib/api';

export type InspectionStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'PASSED' | 'FAILED' | 'ON_HOLD' | 'WAIVED';

export interface InspectionResponse {
  id: string;
  itpRef: string | null;
  title: string;
  discipline: string | null;
  holdPoint: boolean;
  inspector: string | null;
  scheduledDate: string | null;
  completedDate: string | null;
  status: InspectionStatus;
  result: string | null;
  vendorId: string | null;
  documentId: string | null;
  projectId: string;
  overdue: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InspectionSummaryResponse {
  total: number;
  byStatus: Record<InspectionStatus, number>;
  passRate: number;
  overdueHoldPoints: number;
  byDiscipline: Record<string, number>;
}

const api = getApiClient();

export async function listInspections(
  projectId: string,
  filters?: { status?: InspectionStatus; discipline?: string; holdPoint?: boolean; overdue?: boolean; limit?: number; offset?: number }
): Promise<{ inspections: InspectionResponse[]; total: number }> {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.discipline) params.append('discipline', filters.discipline);
  if (filters?.holdPoint !== undefined) params.append('holdPoint', String(filters.holdPoint));
  if (filters?.overdue !== undefined) params.append('overdue', String(filters.overdue));
  if (filters?.limit) params.append('limit', String(filters.limit));
  if (filters?.offset) params.append('offset', String(filters.offset));
  const query = params.toString() ? `?${params.toString()}` : '';
  return api.get<{ inspections: InspectionResponse[]; total: number }>(`/api/v1/projects/${projectId}/inspections${query}`);
}

export async function getInspection(projectId: string, inspId: string): Promise<InspectionResponse> {
  return api.get<InspectionResponse>(`/api/v1/projects/${projectId}/inspections/${inspId}`);
}

export async function createInspection(
  projectId: string,
  data: { title: string; itpRef?: string; discipline?: string; holdPoint?: boolean; inspector?: string; scheduledDate?: string; vendorId?: string; documentId?: string }
): Promise<InspectionResponse> {
  return api.post<InspectionResponse>(`/api/v1/projects/${projectId}/inspections`, data);
}

export async function updateInspection(
  projectId: string,
  inspId: string,
  data: Partial<{ title: string; status: InspectionStatus; result: string; completedDate: string; inspector: string }>
): Promise<InspectionResponse> {
  return api.put<InspectionResponse>(`/api/v1/projects/${projectId}/inspections/${inspId}`, data);
}

export async function getInspectionSummary(projectId: string): Promise<InspectionSummaryResponse> {
  return api.get<InspectionSummaryResponse>(`/api/v1/projects/${projectId}/inspections/summary`);
}
