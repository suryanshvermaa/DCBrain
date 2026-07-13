import { getApiClient } from '@/lib/api';

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ScheduleImportStatus = 'SUCCESS' | 'PARTIAL' | 'FAILED';

export interface ScheduleActivity {
  id: string;
  activityId: string;
  name: string;
  wbsCode: string | null;
  wbsName: string | null;
  plannedStart: string | null;
  plannedFinish: string | null;
  actualStart: string | null;
  actualFinish: string | null;
  durationDays: number;
  totalFloat: number;
  freeFloat: number;
  isCritical: boolean;
  riskScore: number;
  riskLevel: RiskLevel;
  predecessors: string[];
  mitigationActions: string[];
}

export interface ScheduleRiskSummary {
  projectId: string;
  latestImport: {
    id: string;
    filename: string;
    importedAt: string;
    activityCount: number;
  } | null;
  health: {
    totalActivities: number;
    criticalPathCount: number;
    highRiskCount: number;
    spi: number;
    floatConsumptionRate: number;
    predictedCompletionDate: string | null;
    overallRiskScore: number;
  };
  riskDistribution: {
    LOW: number;
    MEDIUM: number;
    HIGH: number;
    CRITICAL: number;
  };
}

export interface ScheduleImport {
  id: string;
  filename: string;
  activityCount: number;
  status: ScheduleImportStatus;
  errorMessage: string | null;
  importedAt: string;
}

export interface ScheduleActivitiesResponse {
  activities: ScheduleActivity[];
  total: number;
}

export interface ScheduleImportResult {
  importId: string;
  activityCount: number;
}

// --------------------------------------------------------------------------
// API functions
// --------------------------------------------------------------------------

const api = getApiClient();

/**
 * Import a P6 XML schedule file for a project.
 * Sends as multipart/form-data with a "file" field.
 */
export async function importScheduleFile(projectId: string, file: File): Promise<ScheduleImportResult> {
  const formData = new FormData();
  formData.append('file', file);
  return api.postForm<ScheduleImportResult>(
    `/api/v1/projects/${projectId}/schedule/import`,
    formData
  );
}

export async function getScheduleRiskSummary(projectId: string): Promise<ScheduleRiskSummary> {
  return api.get<ScheduleRiskSummary>(`/api/v1/projects/${projectId}/schedule/summary`);
}

export async function getScheduleActivities(
  projectId: string,
  filters?: { riskLevel?: RiskLevel; isCritical?: boolean; limit?: number; offset?: number }
): Promise<ScheduleActivitiesResponse> {
  const params = new URLSearchParams();
  if (filters?.riskLevel) params.set('riskLevel', filters.riskLevel);
  if (filters?.isCritical !== undefined) params.set('isCritical', String(filters.isCritical));
  if (filters?.limit !== undefined) params.set('limit', String(filters.limit));
  if (filters?.offset !== undefined) params.set('offset', String(filters.offset));

  const query = params.toString();
  return api.get<ScheduleActivitiesResponse>(
    `/api/v1/projects/${projectId}/schedule/activities${query ? `?${query}` : ''}`
  );
}

export async function listScheduleImports(projectId: string): Promise<ScheduleImport[]> {
  return api.get<ScheduleImport[]>(`/api/v1/projects/${projectId}/schedule/imports`);
}


