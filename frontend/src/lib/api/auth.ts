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
  return api.post<AuthSessionResponse>('/v1/auth/login', payload, { credentials: 'include' });
}

export async function register(payload: RegisterPayload): Promise<AuthSessionResponse> {
  return api.post<AuthSessionResponse>('/v1/auth/register', payload, { credentials: 'include' });
}

export async function refresh(): Promise<AuthSessionResponse> {
  return api.post<AuthSessionResponse>('/v1/auth/refresh', {}, { credentials: 'include' });
}

export async function me(): Promise<{ user: AuthUser }> {
  return api.get<{ user: AuthUser }>('/v1/auth/me');
}