import { getApiClient } from '@/lib/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ActivityFeedItem {
  id: string;
  type: string;
  title: string;
  description: string | null;
  createdAt: string;
  userName: string;
}

export interface DashboardSummary {
  projectId: string;
  healthScore: number;
  documents: {
    total: number;
    processed: number;
    queued: number;
    failed: number;
    byCategory: Record<string, number>;
  };
  compliance: {
    score: number;
    totalFindings: number;
    criticalFindings: number;
    warningFindings: number;
    lastCheckedAt: string | null;
  };
  schedule: {
    totalActivities: number;
    highRiskCount: number;
    criticalPathCount: number;
    spi: number;
    overallRiskScore: number;
    lastImportedAt: string | null;
  };
  recentActivity: ActivityFeedItem[];
  generatedAt: string;
}

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

const api = getApiClient();

export async function getDashboardSummary(
  projectId: string,
  options?: { refresh?: boolean },
): Promise<DashboardSummary> {
  const query = options?.refresh ? '?refresh=true' : '';
  return api.get<DashboardSummary>(
    `/api/v1/projects/${projectId}/dashboard/summary${query}`,
  );
}
