import { Router, type Request, type Response } from 'express';
import { asyncHandler } from '@/core/middleware/errorHandler';
import { authResponseSchema, loginRequestSchema, registerRequestSchema } from './schemas';
import { assertAuthRateLimit, resetAuthRateLimit } from './rateLimit';
import { requireAuth, requirePermission, type AuthenticatedRequest } from './middleware';
import { login, refresh, register, getCurrentUser } from './service';
import { buildRefreshCookieOptions, REFRESH_COOKIE_NAME } from './security';
import { createAuditLog } from './repository';

export const authRouter = Router();

function extractRefreshTokenFromCookie(cookieHeader: string | undefined): string {
  if (!cookieHeader) {
    throw new Error('Missing refresh token');
  }

  const cookies = cookieHeader.split(';').map((part) => part.trim());
  const match = cookies.find((cookie) => cookie.startsWith(`${REFRESH_COOKIE_NAME}=`));

  if (!match) {
    throw new Error('Missing refresh token');
  }

  return decodeURIComponent(match.slice(REFRESH_COOKIE_NAME.length + 1));
}

function setRefreshCookie(res: Response, refreshToken: string, expiresInSeconds: number): void {
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, buildRefreshCookieOptions(expiresInSeconds));
}

function getRequestIp(req: Request): string {
  return req.ip ?? '127.0.0.1';
}

function isRateLimitError(error: unknown): error is Error & { statusCode?: number; code?: string } {
  return Boolean(
    error instanceof Error &&
      ((error as { statusCode?: number }).statusCode === 429 ||
        (error as { code?: string }).code === 'RATE_LIMIT_EXCEEDED' ||
        error.message.includes('Too many authentication attempts'))
  );
}

authRouter.post(
  '/register',
  asyncHandler(async (req: Request, res: Response) => {
    const ipAddress = getRequestIp(req);

    try {
      await assertAuthRateLimit('register', ipAddress);
    } catch (error) {
      if (isRateLimitError(error)) {
        res.status(429).json({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: error.message,
          },
        });
        return;
      }

      throw error;
    }

    const input = registerRequestSchema.parse(req.body);
    const result = await register(input, {
      ipAddress,
      userAgent: req.headers['user-agent'],
    });
    const responseBody = authResponseSchema.parse({
      user: result.user,
      token: {
        accessToken: result.token.accessToken,
        tokenType: result.token.tokenType,
        expiresInSeconds: result.token.expiresInSeconds,
      },
    });
    setRefreshCookie(res, result.token.refreshToken, result.token.refreshTokenExpiresInSeconds);
    await resetAuthRateLimit('register', ipAddress);
    res.status(201).json({
      user: responseBody.user,
      token: responseBody.token,
    });
  })
);

authRouter.post(
  '/login',
  asyncHandler(async (req: Request, res: Response) => {
    const ipAddress = getRequestIp(req);

    try {
      await assertAuthRateLimit('login', ipAddress);
    } catch (error) {
      if (isRateLimitError(error)) {
        res.status(429).json({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: error.message,
          },
        });
        return;
      }

      throw error;
    }

    const input = loginRequestSchema.parse(req.body);
    const result = await login(input, {
      ipAddress,
      userAgent: req.headers['user-agent'],
    });
    const responseBody = authResponseSchema.parse({
      user: result.user,
      token: {
        accessToken: result.token.accessToken,
        tokenType: result.token.tokenType,
        expiresInSeconds: result.token.expiresInSeconds,
      },
    });
    setRefreshCookie(res, result.token.refreshToken, result.token.refreshTokenExpiresInSeconds);
    await resetAuthRateLimit('login', ipAddress);
    res.status(200).json({
      user: responseBody.user,
      token: responseBody.token,
    });
  })
);

authRouter.post(
  '/refresh',
  asyncHandler(async (req: Request, res: Response) => {
    const ipAddress = getRequestIp(req);

    try {
      await assertAuthRateLimit('refresh', ipAddress);
    } catch (error) {
      if (isRateLimitError(error)) {
        res.status(429).json({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: error.message,
          },
        });
        return;
      }

      throw error;
    }

    const refreshToken = extractRefreshTokenFromCookie(req.headers.cookie);
    const result = await refresh(refreshToken, {
      ipAddress,
      userAgent: req.headers['user-agent'],
    });
    const responseBody = authResponseSchema.parse({
      user: result.user,
      token: {
        accessToken: result.token.accessToken,
        tokenType: result.token.tokenType,
        expiresInSeconds: result.token.expiresInSeconds,
      },
    });
    setRefreshCookie(res, result.token.refreshToken, result.token.refreshTokenExpiresInSeconds);
    await resetAuthRateLimit('refresh', ipAddress);
    res.status(200).json({
      user: responseBody.user,
      token: responseBody.token,
    });
  })
);

authRouter.get(
  '/me',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const request = req as Request & {
      auth?: {
        user: { id: string };
      };
    };
    const user = await getCurrentUser(request.auth?.user.id ?? '');
    res.status(200).json({ user });
  })
);

authRouter.get(
  '/admin-only',
  requireAuth,
  requirePermission('manage_users'),
  asyncHandler(async (_req: Request, res: Response) => {
    res.status(200).json({ message: 'admin access granted' });
  })
);

authRouter.post(
  '/logout',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const request = req as AuthenticatedRequest;
    const userId = request.auth?.user.id;
    const ipAddress = getRequestIp(req);

    res.clearCookie(REFRESH_COOKIE_NAME, buildRefreshCookieOptions(0));

    if (userId) {
      await createAuditLog({
        userId,
        action: 'auth.logout',
        resourceType: 'user',
        resourceId: userId,
        ipAddress,
        userAgent: req.headers['user-agent'],
      });
    }

    res.status(200).json({ success: true, message: 'Logged out successfully' });
  })
);