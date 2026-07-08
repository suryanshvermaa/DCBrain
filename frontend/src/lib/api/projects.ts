import { getApiClient } from '@/lib/api';

export interface Project {
  id: string;
  name: string;
  description: string | null;
  code: string;
  status: string;
  location: string | null;
  createdAt: string;
  updatedAt: string;
  memberCount: number;
}

export interface CreateProjectPayload {
  name: string;
  code: string;
  description?: string;
  location?: string;
}

const api = getApiClient();

export async function listProjects(): Promise<{ projects: Project[] }> {
  return api.get<{ projects: Project[] }>('/api/v1/projects');
}

export async function createProject(payload: CreateProjectPayload): Promise<{ project: Project }> {
  return api.post<{ project: Project }>('/api/v1/projects', payload);
}
