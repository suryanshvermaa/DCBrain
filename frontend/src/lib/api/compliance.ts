import { getApiClient } from '@/lib/api';

export interface ComplianceFinding {
  id: string;
  requirement: string;
  standard: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  severity: 'critical' | 'major' | 'minor' | 'observation';
  evidence: string;
  evidenceSource: string;
  recommendation: string;
}

export interface ComplianceCheckResponse {
  id: string;
  status: 'COMPLETED' | 'FAILED';
  complianceScore: number;
  standards: string[];
  findings: ComplianceFinding[];
  summary: {
    totalFindings: number;
    compliantFindings: number;
    warningFindings: number;
    failedFindings: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ComplianceSummaryResponse {
  projectId: string;
  latestCheck: {
    id: string;
    complianceScore: number;
    status: 'COMPLETED' | 'FAILED';
    createdAt: string;
  } | null;
  summary: {
    totalFindings: number;
    compliantFindings: number;
    warningFindings: number;
    failedFindings: number;
    complianceScore: number;
  };
}

const api = getApiClient();

export async function runComplianceCheck(projectId: string, payload: { documentIds?: string[]; standards?: string[]; notes?: string }): Promise<ComplianceCheckResponse> {
  return api.post<ComplianceCheckResponse>(`/api/v1/projects/${projectId}/compliance/check`, payload);
}

export async function getComplianceSummary(projectId: string): Promise<ComplianceSummaryResponse> {
  return api.get<ComplianceSummaryResponse>(`/api/v1/projects/${projectId}/compliance/summary`);
}
