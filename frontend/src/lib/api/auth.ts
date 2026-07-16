import { getApiClient } from '@/lib/api';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  projects: string[];
}

export interface AuthToken {
  accessToken: string;
  tokenType: 'Bearer';
  expiresInSeconds: number;
}

export interface AuthSessionResponse {
  user: AuthUser;
  token: AuthToken;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload extends LoginPayload {
  firstName: string;
  lastName: string;
}

const api = getApiClient();

export async function login(payload: LoginPayload): Promise<AuthSessionResponse> {
  return api.post<AuthSessionResponse>('/api/v1/auth/login', payload, { credentials: 'include' });
}

export async function register(payload: RegisterPayload): Promise<AuthSessionResponse> {
  return api.post<AuthSessionResponse>('/api/v1/auth/register', payload, { credentials: 'include' });
}

export async function refresh(): Promise<AuthSessionResponse> {
  return api.post<AuthSessionResponse>('/api/v1/auth/refresh', {}, { credentials: 'include' });
}

export async function me(): Promise<{ user: AuthUser }> {
  return api.get<{ user: AuthUser }>('/api/v1/auth/me');
}

// ── Change password (any authenticated user) ──────────────────────────────────
export async function changePassword(payload: { currentPassword: string; newPassword: string }): Promise<{ success: boolean; message: string }> {
  return api.post<{ success: boolean; message: string }>('/api/v1/auth/change-password', payload);
}

// ── Admin: IAM-style user management ─────────────────────────────────────────
export interface AdminUser {
  id: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface CreateUserPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface CreateUserResponse {
  user: AdminUser;
  credentials: { email: string; password: string };
}

export async function adminListUsers(): Promise<{ users: AdminUser[] }> {
  return api.get<{ users: AdminUser[] }>('/api/v1/admin/users');
}

export async function adminCreateUser(payload: CreateUserPayload): Promise<CreateUserResponse> {
  return api.post<CreateUserResponse>('/api/v1/admin/users', payload);
}

export async function adminUpdateUser(
  userId: string,
  payload: { role?: string; isActive?: boolean }
): Promise<{ user: AdminUser }> {
  return api.patch<{ user: AdminUser }>(`/api/v1/admin/users/${userId}`, payload);
}