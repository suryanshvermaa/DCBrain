import { getApiClient } from '@/lib/api';

export interface AgentScheduleConfig {
  cron: string;
  isActive: boolean;
}

export interface AgentRunBrief {
  id: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
  durationMs: number | null;
}

export interface AgentConfig {
  type: string;
  name: string;
  schedule: AgentScheduleConfig | null;
  latestRun: AgentRunBrief | null;
}

export interface AgentRunDetail {
  id: string;
  agentType: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  input: any;
  output: any;
  error: string | null;
  durationMs: number | null;
  costEstimate: number | null;
  projectId: string;
  createdAt: string;
  updatedAt: string;
  triggeredBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}

const api = getApiClient();

export async function listAgents(projectId: string): Promise<AgentConfig[]> {
  return api.get<AgentConfig[]>(`/api/v1/projects/${projectId}/agents`);
}

export async function triggerAgentRun(
  projectId: string,
  agentType: string,
  body: { query?: string; documentIds?: string[]; standards?: string[]; notes?: string; runAsync?: boolean }
): Promise<{ runId: string; status: string; output?: any }> {
  return api.post(`/api/v1/projects/${projectId}/agents/${agentType}/run`, body);
}

export async function listAgentRuns(projectId: string, agentType?: string): Promise<AgentRunDetail[]> {
  const url = agentType
    ? `/api/v1/projects/${projectId}/agents/runs?agentType=${agentType}`
    : `/api/v1/projects/${projectId}/agents/runs`;
  return api.get<AgentRunDetail[]>(url);
}

export async function getAgentRunDetails(projectId: string, runId: string): Promise<AgentRunDetail> {
  return api.get<AgentRunDetail>(`/api/v1/projects/${projectId}/agents/runs/${runId}`);
}

export async function updateAgentSchedule(
  projectId: string,
  body: { agentType: string; schedule: string; isActive: boolean }
): Promise<any> {
  return api.put(`/api/v1/projects/${projectId}/agents/schedule`, body);
}
