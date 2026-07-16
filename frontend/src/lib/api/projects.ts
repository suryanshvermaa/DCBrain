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

export interface ProjectMember {
  id: string;
  name: string;
  email: string;
  globalRole: string;
  role: string;
  joinedAt: string;
  isNewUser?: boolean;
}

export async function getProjectMembers(projectId: string): Promise<{ members: ProjectMember[] }> {
  return api.get<{ members: ProjectMember[] }>(`/api/v1/projects/${projectId}/members`);
}

export async function inviteProjectMember(
  projectId: string,
  payload: { email: string; role: string }
): Promise<{ member: ProjectMember }> {
  return api.post<{ member: ProjectMember }>(`/api/v1/projects/${projectId}/members`, payload);
}

export async function updateProjectMemberRole(
  projectId: string,
  userId: string,
  role: string
): Promise<{ member: ProjectMember }> {
  return api.patch<{ member: ProjectMember }>(`/api/v1/projects/${projectId}/members/${userId}`, { role });
}

export async function removeProjectMember(projectId: string, userId: string): Promise<void> {
  return api.delete<void>(`/api/v1/projects/${projectId}/members/${userId}`);
}

// --- Chat APIs ---
export interface ChatSession {
  id: string;
  title: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'USER' | 'ASSISTANT' | 'SYSTEM';
  content: string;
  sources?: Array<{ content: string }>;
  createdAt: string;
}

export async function listChatSessions(projectId: string): Promise<{ sessions: ChatSession[] }> {
  return api.get<{ sessions: ChatSession[] }>(`/api/v1/projects/${projectId}/chat/sessions`);
}

export async function createChatSession(projectId: string, title?: string): Promise<{ session: ChatSession }> {
  return api.post<{ session: ChatSession }>(`/api/v1/projects/${projectId}/chat/sessions`, { title });
}

export async function getChatMessages(projectId: string, sessionId: string): Promise<{ messages: ChatMessage[] }> {
  return api.get<{ messages: ChatMessage[] }>(`/api/v1/projects/${projectId}/chat/sessions/${sessionId}/messages`);
}

export async function sendChatMessage(projectId: string, sessionId: string, content: string): Promise<{ message: ChatMessage }> {
  return api.post<{ message: ChatMessage }>(`/api/v1/projects/${projectId}/chat/sessions/${sessionId}/messages`, { content });
}

export async function exportChatSessionPDF(projectId: string, sessionId: string): Promise<Blob> {
  const token = api.getToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/projects/${projectId}/chat/sessions/${sessionId}/export`, {
    headers
  });
  if (!res.ok) {
    throw new Error('Failed to export chat session');
  }
  return res.blob();
}
