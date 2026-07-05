import { Router, type Request, type Response } from 'express';
import { asyncHandler } from '@/core/middleware/errorHandler';
import { authResponseSchema, loginRequestSchema, registerRequestSchema } from './schemas';
import { assertAuthRateLimit, resetAuthRateLimit } from './rateLimit';
import { requireAuth, requirePermission } from './middleware';
import { login, refresh, register, getCurrentUser } from './service';
import { buildRefreshCookieOptions, REFRESH_COOKIE_NAME } from './security';

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

authRouter.post(
  '/register',
  asyncHandler(async (req: Request, res: Response) => {
    const ipAddress = getRequestIp(req);
    await assertAuthRateLimit('register', ipAddress);
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
    await assertAuthRateLimit('login', ipAddress);
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
    await assertAuthRateLimit('refresh', ipAddress);
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