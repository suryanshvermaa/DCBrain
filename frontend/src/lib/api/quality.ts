import { getApiClient } from '@/lib/api';

export interface QualitySummaryResponse {
  projectId: string;
  qualityScore: number;
  ncr: {
    total: number;
    open: number;
    bySeverity: { MINOR: number; MAJOR: number; CRITICAL: number };
    healthScore: number;
  };
  inspection: {
    total: number;
    passed: number;
    failed: number;
    passRate: number;
  };
  commissioning: {
    total: number;
    passed: number;
    failed: number;
    passRate: number;
  };
  generatedAt: string;
}

const api = getApiClient();

export async function getQualitySummary(projectId: string): Promise<QualitySummaryResponse> {
  return api.get<QualitySummaryResponse>(`/api/v1/projects/${projectId}/quality/summary`);
}
