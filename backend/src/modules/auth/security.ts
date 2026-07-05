import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import config from '@/core/config';
import { UnauthorizedError } from '@/core/errors';
import { redis } from '@/lib/redis';

export const PASSWORD_HASH_ROUNDS = 12;
export const REFRESH_COOKIE_NAME = 'dcbrain_refresh_token';
const REFRESH_COOKIE_PATH = '/api/v1/auth';

export type AuthPermission =
  | 'manage_users'
  | 'create_projects'
  | 'manage_project_members'
  | 'upload_documents'
  | 'delete_documents'
  | 'search_documents'
  | 'use_chat'
  | 'run_compliance_checks'
  | 'import_schedule_data'
  | 'import_procurement_data'
  | 'configure_agents'
  | 'view_dashboard'
  | 'export_data';

export const ROLE_PERMISSION_MAP: Record<Role, AuthPermission[]> = {
  ADMIN: [
    'manage_users',
    'create_projects',
    'manage_project_members',
    'upload_documents',
    'delete_documents',
    'search_documents',
    'use_chat',
    'run_compliance_checks',
    'import_schedule_data',
    'import_procurement_data',
    'configure_agents',
    'view_dashboard',
    'export_data',
  ],
  PROJECT_MANAGER: [
    'create_projects',
    'manage_project_members',
    'upload_documents',
    'delete_documents',
    'search_documents',
    'use_chat',
    'run_compliance_checks',
    'import_schedule_data',
    'import_procurement_data',
    'view_dashboard',
    'export_data',
  ],
  ENGINEER: [
    'upload_documents',
    'delete_documents',
    'search_documents',
    'use_chat',
    'run_compliance_checks',
    'import_schedule_data',
    'import_procurement_data',
    'view_dashboard',
    'export_data',
  ],
  PROCUREMENT: ['upload_documents', 'search_documents', 'use_chat', 'import_procurement_data', 'view_dashboard', 'export_data'],
  QA_QC: ['upload_documents', 'search_documents', 'use_chat', 'run_compliance_checks', 'view_dashboard', 'export_data'],
  VIEWER: ['search_documents', 'use_chat', 'view_dashboard'],
};

export interface AccessTokenClaims {
  sub: string;
  email: string;
  role: Role;
  projects: string[];
  tokenType: 'access';
  jti: string;
}

export interface RefreshTokenClaims {
  sub: string;
  tokenType: 'refresh';
  jti: string;
  expiresAt: number;
}

const refreshTokenBlacklist = new Map<string, number>();

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, PASSWORD_HASH_ROUNDS);
}

export function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

function signToken(payload: object, expiresIn: string): string {
  return jwt.sign(payload, config.JWT_SECRET_KEY as jwt.Secret, {
    algorithm: config.JWT_ALGORITHM as jwt.Algorithm,
    expiresIn: expiresIn as jwt.SignOptions['expiresIn'],
  });
}

function buildTokenClaims<T extends 'access' | 'refresh'>(userId: string, tokenType: T) {
  return {
    sub: userId,
    tokenType,
    jti: crypto.randomUUID(),
  };
}

export function createAccessToken(input: {
  userId: string;
  email: string;
  role: Role;
  projects: string[];
}): { token: string; claims: AccessTokenClaims; expiresInSeconds: number } {
  const claims: AccessTokenClaims = {
    ...buildTokenClaims(input.userId, 'access'),
    email: input.email,
    role: input.role,
    projects: input.projects,
  };
  const expiresInSeconds = config.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60;
  return {
    token: signToken(claims, `${config.JWT_ACCESS_TOKEN_EXPIRE_MINUTES}m`),
    claims,
    expiresInSeconds,
  };
}

export function createRefreshToken(userId: string): { token: string; claims: RefreshTokenClaims; expiresInSeconds: number } {
  const expiresInSeconds = config.JWT_REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60;
  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const claims: RefreshTokenClaims = {
    ...buildTokenClaims(userId, 'refresh'),
    expiresAt,
  };
  return {
    token: signToken(claims, `${config.JWT_REFRESH_TOKEN_EXPIRE_DAYS}d`),
    claims,
    expiresInSeconds,
  };
}

export function verifyAccessToken(token: string): AccessTokenClaims {
  const payload = jwt.verify(token, config.JWT_SECRET_KEY as jwt.Secret, {
    algorithms: [config.JWT_ALGORITHM as jwt.Algorithm],
  }) as jwt.JwtPayload & {
    tokenType?: string;
    email?: string;
    role?: Role;
    projects?: unknown;
    jti?: string;
  };

  if (payload['tokenType'] !== 'access' || typeof payload.sub !== 'string') {
    throw new UnauthorizedError('Invalid access token');
  }

  return {
    sub: payload.sub,
    email: String(payload['email'] ?? ''),
    role: payload['role'] as Role,
    projects: Array.isArray(payload['projects']) ? payload['projects'].filter((value): value is string => typeof value === 'string') : [],
    tokenType: 'access',
    jti: String(payload['jti'] ?? ''),
  };
}

export function verifyRefreshToken(token: string): RefreshTokenClaims {
  const payload = jwt.verify(token, config.JWT_SECRET_KEY as jwt.Secret, {
    algorithms: [config.JWT_ALGORITHM as jwt.Algorithm],
  }) as jwt.JwtPayload & {
    tokenType?: string;
    jti?: string;
  };

  if (payload['tokenType'] !== 'refresh' || typeof payload.sub !== 'string') {
    throw new UnauthorizedError('Invalid refresh token');
  }

  return {
    sub: payload.sub,
    tokenType: 'refresh',
    jti: String(payload['jti'] ?? ''),
    expiresAt: Number(payload.exp ?? 0),
  };
}

export function isPermissionGranted(role: Role, permission: AuthPermission): boolean {
  return ROLE_PERMISSION_MAP[role].includes(permission);
}

function getRefreshBlacklistKey(jti: string): string {
  return `auth:refresh:blacklist:${jti}`;
}

export async function isRefreshTokenBlacklisted(jti: string): Promise<boolean> {
  const key = getRefreshBlacklistKey(jti);

  if (redis.status === 'ready') {
    const exists = await redis.exists(key);
    return exists > 0;
  }

  const expiresAt = refreshTokenBlacklist.get(key);
  if (!expiresAt) {
    return false;
  }

  if (expiresAt <= Date.now()) {
    refreshTokenBlacklist.delete(key);
    return false;
  }

  return true;
}

export async function blacklistRefreshToken(jti: string, expiresAtSeconds: number): Promise<void> {
  const key = getRefreshBlacklistKey(jti);
  const ttlMs = Math.max(0, expiresAtSeconds * 1000 - Date.now());

  if (ttlMs <= 0) {
    return;
  }

  if (redis.status === 'ready') {
    await redis.set(key, '1', 'PX', ttlMs);
    return;
  }

  refreshTokenBlacklist.set(key, Date.now() + ttlMs);
}

export function buildRefreshCookieOptions(expiresInSeconds: number) {
  return {
    httpOnly: true,
    secure: config.APP_ENV === 'production',
    sameSite: 'strict' as const,
    path: REFRESH_COOKIE_PATH,
    maxAge: expiresInSeconds * 1000,
  };
}