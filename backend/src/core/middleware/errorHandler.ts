import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { logger } from '@/lib/logger';
import { ValidationError, InternalServerError, isAppError } from '@/core/errors';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    name: err.name,
  });

  if (err.name === 'MulterError') {
    const multerError = err as Error & { code?: string };
    const statusCode = multerError.code === 'LIMIT_FILE_SIZE' || multerError.code === 'LIMIT_FILE_COUNT' ? 413 : 400;
    res.status(statusCode).json({
      success: false,
      error: {
        code: multerError.code ?? 'UPLOAD_ERROR',
        message: multerError.message,
      },
    });
    return;
  }

  if (err instanceof ZodError) {
    const details: Record<string, string[]> = {};
    err.errors.forEach((e) => {
      const path = e.path.join('.');
      if (!details[path]) {
        details[path] = [];
      }
      details[path].push(e.message);
    });
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details,
      },
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const target = err.meta?.['target'];
      let field = 'field';
      if (Array.isArray(target) && target.length > 0 && typeof target[0] === 'string') {
        field = target[0];
      }
      res.status(409).json({
        success: false,
        error: {
          code: 'CONFLICT',
          message: `A record with this ${field} already exists`,
        },
      });
      return;
    }

    if (err.code === 'P2025') {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Record not found',
        },
      });
      return;
    }
  }

  if (isAppError(err)) {
    const response: { success: boolean; error: Record<string, unknown> } = {
      success: false,
      error: {
        code: err.code,
        message: err.message,
      },
    };

    if (err instanceof ValidationError && Object.keys(err.details).length > 0) {
      response.error['details'] = err.details;
    }

    res.status(err.statusCode).json(response);
    return;
  }

  const internalError = new InternalServerError();
  res.status(internalError.statusCode).json({
    success: false,
    error: {
      code: internalError.code,
      message:
        process.env['APP_ENV'] === 'production' ? 'An unexpected error occurred' : err.message,
    },
  });
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found',
    },
  });
}

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
