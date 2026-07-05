import type { NextFunction, Request, Response } from 'express';
import { Role } from '@prisma/client';
import { ForbiddenError, UnauthorizedError } from '@/core/errors';
import { findUserById, type AuthUserRecord } from './repository';
import { isPermissionGranted, verifyAccessToken, type AuthPermission } from './security';
import type { AuthUserResponse } from './service';

export interface AuthenticatedRequest extends Request {
  auth?: {
    user: AuthUserResponse;
    tokenId: string;
  };
}

function extractBearerToken(authorizationHeader: string | undefined): string {
  if (!authorizationHeader?.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing access token');
  }

  return authorizationHeader.slice('Bearer '.length).trim();
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

export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const token = extractBearerToken(req.headers.authorization);
    const claims = verifyAccessToken(token);
    const user = await findUserById(claims.sub);

    if (!user || !user.isActive) {
      throw new UnauthorizedError('Invalid access token');
    }

    (req as AuthenticatedRequest).auth = {
      user: toUserResponse(user),
      tokenId: claims.jti,
    };
    next();
  } catch (error) {
    next(error);
  }
}

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const request = req as AuthenticatedRequest;
      if (!request.auth) {
        throw new UnauthorizedError('Unauthorized');
      }

      if (!roles.includes(request.auth.user.role)) {
        throw new ForbiddenError('You do not have permission to access this resource');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

export function requirePermission(permission: AuthPermission) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const request = req as AuthenticatedRequest;
      if (!request.auth) {
        throw new UnauthorizedError('Unauthorized');
      }

      if (!isPermissionGranted(request.auth.user.role, permission)) {
        throw new ForbiddenError('You do not have permission to access this resource');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}