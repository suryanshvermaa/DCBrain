import { getApiClient } from '@/lib/api';

export interface ProjectNotification {
  id: string;
  type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS' | 'TASK_ASSIGNED' | 'DEADLINE_APPROACHING' | 'COMPLIANCE_ISSUE' | 'DOCUMENT_READY';
  title: string;
  message: string;
  link: string | null;
  data: any;
  read: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationPreference {
  id: string;
  userId: string;
  inApp: boolean;
  emailDigest: boolean;
  createdAt: string;
  updatedAt: string;
}

const api = getApiClient();

export async function listNotifications(): Promise<{ notifications: ProjectNotification[] }> {
  return api.get<{ notifications: ProjectNotification[] }>('/api/v1/notifications');
}

export async function markAsRead(id: string): Promise<{ notification: ProjectNotification }> {
  return api.put<{ notification: ProjectNotification }>(`/api/v1/notifications/${id}/read`, {});
}

export async function markAllAsRead(): Promise<{ success: boolean; message: string }> {
  return api.put<{ success: boolean; message: string }>('/api/v1/notifications/read-all', {});
}

export async function getPreferences(): Promise<{ preferences: NotificationPreference }> {
  return api.get<{ preferences: NotificationPreference }>('/api/v1/notifications/preferences');
}

export async function updatePreferences(payload: {
  inApp?: boolean;
  emailDigest?: boolean;
}): Promise<{ preferences: NotificationPreference }> {
  return api.put<{ preferences: NotificationPreference }>('/api/v1/notifications/preferences', payload);
}
