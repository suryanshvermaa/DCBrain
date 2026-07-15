import { getApiClient } from '@/lib/api';

const api = getApiClient();
export interface Simulation {
  id: string;
  name: string;
  description?: string;
  targetActivityId: string;
  delayDays: number;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  impacts?: Array<{
    entityName: string;
    labels: string[];
    estimatedDelayDays: number;
  }>;
  mitigationPlans?: { content: string };
  costImpact?: number;
  timeImpactDays?: number;
  error?: string;
  projectId: string;
  createdAt: string;
}

export async function listSimulations(projectId: string): Promise<Simulation[]> {
  return api.get<Simulation[]>(`/api/v1/projects/${projectId}/simulations`);
}

export async function getSimulation(projectId: string, simId: string): Promise<Simulation> {
  return api.get<Simulation>(`/api/v1/projects/${projectId}/simulations/${simId}`);
}

export async function runDelaySimulation(
  projectId: string,
  payload: {
    name: string;
    description?: string;
    targetActivityId: string;
    delayDays: number;
    assumptions?: Record<string, any>;
  }
): Promise<{ id: string }> {
  return api.post<{ id: string }>(`/api/v1/projects/${projectId}/simulations/delay`, payload);
}

export async function generateMitigationPlan(projectId: string, simId: string): Promise<{ content: string }> {
  return api.post<{ content: string }>(`/api/v1/projects/${projectId}/simulations/${simId}/mitigate`);
}
