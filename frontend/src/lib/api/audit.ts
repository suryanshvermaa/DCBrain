import { getApiClient } from '@/lib/api';

export interface AuditLogUser {
  id: string;
  name: string;
  email: string;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  resourceType: string | null;
  resourceId: string | null;
  details: any;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user: AuditLogUser | null;
}

export interface AuditLogResponse {
  logs: AuditLogEntry[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface ProjectActivityEntry {
  id: string;
  type: string;
  title: string;
  description: string | null;
  metadata: any;
  createdAt: string;
  userName: string;
  userEmail: string;
}

const api = getApiClient();

export async function listAuditLogs(params?: {
  page?: number;
  limit?: number;
  action?: string;
  resourceType?: string;
  userId?: string;
}): Promise<AuditLogResponse> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.append('page', params.page.toString());
  if (params?.limit) searchParams.append('limit', params.limit.toString());
  if (params?.action) searchParams.append('action', params.action);
  if (params?.resourceType) searchParams.append('resourceType', params.resourceType);
  if (params?.userId) searchParams.append('userId', params.userId);

  const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
  return api.get<AuditLogResponse>(`/api/v1/admin/audit-log${query}`);
}

export async function listProjectActivity(
  projectId: string,
  params?: {
    type?: string;
    userId?: string;
  }
): Promise<{ activities: ProjectActivityEntry[] }> {
  const searchParams = new URLSearchParams();
  if (params?.type) searchParams.append('type', params.type);
  if (params?.userId) searchParams.append('userId', params.userId);

  const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
  return api.get<{ activities: ProjectActivityEntry[] }>(`/api/v1/projects/${projectId}/activity${query}`);
}
