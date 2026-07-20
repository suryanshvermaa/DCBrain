import type { Role } from '@prisma/client';
import { ConflictError, UnauthorizedError } from '@/core/errors';
import {
  comparePassword,
  createAccessToken,
  createRefreshToken,
  hashPassword,
  blacklistRefreshToken,
  isRefreshTokenBlacklisted,
  verifyRefreshToken,
} from './security';
import {
  createAuditLog,
  createUser,
  findUserByEmail,
  findUserById,
  touchLastLogin,
  type AuthUserRecord,
} from './repository';

export interface AuthContext {
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface AuthUserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  projects: string[];
}

export interface AuthTokenResponse {
  accessToken: string;
  tokenType: 'Bearer';
  expiresInSeconds: number;
  refreshToken: string;
  refreshTokenExpiresInSeconds: number;
}

export interface AuthResponse {
  user: AuthUserResponse;
  token: AuthTokenResponse;
}

export interface RegisterInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

function toUserResponse(user: AuthUserRecord): AuthUserResponse {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    projects: user.projects.map((project) => project.projectId),
  };
}

function buildAuthResponse(user: AuthUserRecord): AuthResponse {
  const accessToken = createAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    projects: user.projects.map((project) => project.projectId),
  });
  const refreshToken = createRefreshToken(user.id);

  return {
    user: toUserResponse(user),
    token: {
      accessToken: accessToken.token,
      tokenType: 'Bearer',
      expiresInSeconds: accessToken.expiresInSeconds,
      refreshToken: refreshToken.token,
      refreshTokenExpiresInSeconds: refreshToken.expiresInSeconds,
    },
  };
}

export async function register(input: RegisterInput, context: AuthContext = {}): Promise<AuthResponse> {
  const existingUser = await findUserByEmail(input.email);

  if (existingUser) {
    throw new ConflictError('An account with that email already exists');
  }

  const passwordHash = await hashPassword(input.password);

  // Self-registrations always default to VIEWER. The initial admin is seeded
  // out-of-band (see scripts/create-admin.ts), never inferred from registration order.
  const user = await createUser({
    email: input.email,
    passwordHash,
    firstName: input.firstName,
    lastName: input.lastName,
    role: 'VIEWER',
  });
  const response = buildAuthResponse(user);

  await createAuditLog({
    userId: user.id,
    action: 'auth.register',
    resourceType: 'user',
    resourceId: user.id,
    details: { email: user.email, role: user.role },
    ipAddress: context.ipAddress ?? null,
    userAgent: context.userAgent ?? null,
  });

  return response;
}

export async function login(input: LoginInput, context: AuthContext = {}): Promise<AuthResponse> {
  const user = await findUserByEmail(input.email);

  if (!user || !user.isActive) {
    await createAuditLog({
      action: 'auth.login.failed',
      resourceType: 'user',
      details: { email: input.email, reason: 'invalid_credentials' },
      ipAddress: context.ipAddress ?? null,
      userAgent: context.userAgent ?? null,
    });
    throw new UnauthorizedError('Invalid email or password');
  }

  const passwordMatches = await comparePassword(input.password, user.passwordHash);

  if (!passwordMatches) {
    await createAuditLog({
      userId: user.id,
      action: 'auth.login.failed',
      resourceType: 'user',
      resourceId: user.id,
      details: { reason: 'invalid_credentials' },
      ipAddress: context.ipAddress ?? null,
      userAgent: context.userAgent ?? null,
    });
    throw new UnauthorizedError('Invalid email or password');
  }

  await touchLastLogin(user.id);
  const refreshedUser = (await findUserById(user.id)) ?? user;
  const response = buildAuthResponse(refreshedUser);

  await createAuditLog({
    userId: user.id,
    action: 'auth.login',
    resourceType: 'user',
    resourceId: user.id,
    details: { role: user.role },
    ipAddress: context.ipAddress ?? null,
    userAgent: context.userAgent ?? null,
  });

  return response;
}

export async function refresh(refreshToken: string, context: AuthContext = {}): Promise<AuthResponse> {
  const claims = verifyRefreshToken(refreshToken);
  if (await isRefreshTokenBlacklisted(claims.jti)) {
    throw new UnauthorizedError('Invalid refresh token');
  }
  const user = await findUserById(claims.sub);

  if (!user || !user.isActive) {
    throw new UnauthorizedError('Invalid refresh token');
  }

  const response = buildAuthResponse(user);

  await createAuditLog({
    userId: user.id,
    action: 'auth.refresh',
    resourceType: 'user',
    resourceId: user.id,
    details: { jti: claims.jti },
    ipAddress: context.ipAddress ?? null,
    userAgent: context.userAgent ?? null,
  });

  await blacklistRefreshToken(claims.jti, claims.expiresAt);

  return response;
}

export async function getCurrentUser(userId: string): Promise<AuthUserResponse> {
  const user = await findUserById(userId);

  if (!user || !user.isActive) {
    throw new UnauthorizedError('Invalid access token');
  }

  return toUserResponse(user);
}
