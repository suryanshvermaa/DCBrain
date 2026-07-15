import { getApiClient } from '@/lib/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ReportType = 'DAILY' | 'WEEKLY' | 'EXECUTIVE' | 'COMPLIANCE' | 'RISK' | 'PROCUREMENT';
export type ReportStatus = 'PENDING' | 'GENERATING' | 'COMPLETED' | 'FAILED';

export interface ReportListItem {
  id: string;
  type: ReportType;
  title: string;
  status: ReportStatus;
  fileSizeBytes: number | null;
  generatedAt: string | null;
  createdAt: string;
  generatedBy: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
}

export interface ReportDetail extends ReportListItem {
  markdownContent: string | null;
  storageKey: string | null;
  error: string | null;
  metadata: Record<string, unknown> | null;
}

export interface ReportListResponse {
  reports: ReportListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface GenerateReportResponse {
  reportId: string;
  status: string;
  report?: ReportDetail;
}

export interface DownloadResponse {
  url?: string;
  markdown?: string;
  filename: string;
}

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

const api = getApiClient();

export async function generateReport(
  projectId: string,
  type: ReportType,
  runAsync: boolean = false,
): Promise<GenerateReportResponse> {
  return api.post<GenerateReportResponse>(`/api/v1/projects/${projectId}/reports/generate`, {
    type,
    runAsync,
  });
}

export async function listReports(
  projectId: string,
  options?: { type?: ReportType; page?: number; pageSize?: number },
): Promise<ReportListResponse> {
  const params = new URLSearchParams();
  if (options?.type) params.set('type', options.type);
  if (options?.page) params.set('page', String(options.page));
  if (options?.pageSize) params.set('pageSize', String(options.pageSize));
  const query = params.toString() ? `?${params.toString()}` : '';
  return api.get<ReportListResponse>(`/api/v1/projects/${projectId}/reports${query}`);
}

export async function getReport(projectId: string, reportId: string): Promise<ReportDetail> {
  return api.get<ReportDetail>(`/api/v1/projects/${projectId}/reports/${reportId}`);
}

export async function downloadReport(
  projectId: string,
  reportId: string,
  format: 'pdf' | 'md' = 'pdf',
): Promise<DownloadResponse> {
  return api.get<DownloadResponse>(
    `/api/v1/projects/${projectId}/reports/${reportId}/download?format=${format}`,
  );
}

export async function downloadPdfBlob(
  projectId: string,
  reportId: string,
): Promise<Blob> {
  return api.getBlob(`/api/v1/projects/${projectId}/reports/${reportId}/download?format=pdf`);
}
