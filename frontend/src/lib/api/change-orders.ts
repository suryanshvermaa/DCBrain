import { getApiClient } from '@/lib/api';

export type ChangeOrderStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface CoResponse {
  id: string;
  number: string;
  title: string;
  description: string;
  reason: string | null;
  costImpact: number;
  scheduleImpactDays: number;
  status: ChangeOrderStatus;
  approvedById: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  documentId: string | null;
  scheduleActivityId: string | null;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CoSummaryResponse {
  total: number;
  byStatus: Record<ChangeOrderStatus, number>;
  totalCostImpact: number;
  totalScheduleImpactDays: number;
  approvedCount: number;
  pendingCount: number;
}

const api = getApiClient();

export async function listChangeOrders(
  projectId: string,
  filters?: { status?: ChangeOrderStatus; limit?: number; offset?: number }
): Promise<{ changeOrders: CoResponse[]; total: number }> {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.limit) params.append('limit', String(filters.limit));
  if (filters?.offset) params.append('offset', String(filters.offset));
  const query = params.toString() ? `?${params.toString()}` : '';
  return api.get<{ changeOrders: CoResponse[]; total: number }>(`/api/v1/projects/${projectId}/change-orders${query}`);
}

export async function getChangeOrder(projectId: string, coId: string): Promise<CoResponse> {
  return api.get<CoResponse>(`/api/v1/projects/${projectId}/change-orders/${coId}`);
}

export async function createChangeOrder(
  projectId: string,
  data: { title: string; description: string; reason?: string; costImpact?: number; scheduleImpactDays?: number; documentId?: string; scheduleActivityId?: string }
): Promise<CoResponse> {
  return api.post<CoResponse>(`/api/v1/projects/${projectId}/change-orders`, data);
}

export async function updateChangeOrder(
  projectId: string,
  coId: string,
  data: Partial<{ title: string; description: string; status: ChangeOrderStatus; reason: string; costImpact: number; scheduleImpactDays: number }>
): Promise<CoResponse> {
  return api.put<CoResponse>(`/api/v1/projects/${projectId}/change-orders/${coId}`, data);
}

export async function getChangeOrderSummary(projectId: string): Promise<CoSummaryResponse> {
  return api.get<CoSummaryResponse>(`/api/v1/projects/${projectId}/change-orders/summary`);
}
