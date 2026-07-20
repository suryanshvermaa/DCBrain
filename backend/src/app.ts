import type { Application, Request, Response, NextFunction } from 'express';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import config from '@/core/config';
import { openApiSpec } from '@/core/openapi';
import { logger } from '@/lib/logger';
import { errorHandler, notFoundHandler, asyncHandler } from '@/core/middleware/errorHandler';
import { routes } from '@/routes';

export function createApp(): Application {
  const app = express();

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: false,
    })
  );

  app.use('/docs', helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://cdn.jsdelivr.net'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
      imgSrc: ["'self'", 'data:', 'https:'],
      fontSrc: ["'self'", 'data:', 'https:'],
    },
  }));

  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/docs')) return next();
    return helmet.contentSecurityPolicy({
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", 'https://cdn.jsdelivr.net'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
        imgSrc: ["'self'", 'data:', 'https:'],
        fontSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", 'https://dcbrain-api.nebula-hack.tech', 'wss://dcbrain-api.nebula-hack.tech'],
      },
    })(req, res, next);
  });

  const allowedOrigins = config.FRONTEND_URL.split(',').map((url) => url.trim());
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  app.use(express.json({ limit: `${config.MAX_UPLOAD_SIZE_MB}mb` }));
  app.use(express.urlencoded({ extended: true, limit: `${config.MAX_UPLOAD_SIZE_MB}mb` }));

  app.use((req: Request, _res: Response, next: NextFunction) => {
    logger.debug('Incoming request', {
      method: req.method,
      path: req.path,
      query: req.query,
      ip: req.ip,
    });
    next();
  });

  app.get(
    '/health',
    asyncHandler(async (_req: Request, res: Response) => {
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: config.APP_VERSION,
        environment: config.APP_ENV,
        services: {
          database: 'unknown',
          redis: 'unknown',
          chromadb: 'unknown',
          minio: 'unknown',
          neo4j: 'unknown',
        },
      };

      try {
        const { prisma } = await import('@/lib/prisma');
        await prisma.$queryRaw`SELECT 1`;
        health.services.database = 'healthy';
      } catch {
        health.services.database = 'unhealthy';
        health.status = 'degraded';
      }

      try {
        const { checkMinioHealth } = await import('@/lib/minio');
        health.services.minio = (await checkMinioHealth()) ? 'healthy' : 'unhealthy';
        if (health.services.minio === 'unhealthy') health.status = 'degraded';
      } catch {
        health.services.minio = 'unhealthy';
        health.status = 'degraded';
      }

      try {
        const { checkChromaHealth } = await import('@/lib/chroma');
        health.services.chromadb = (await checkChromaHealth()) ? 'healthy' : 'unhealthy';
        if (health.services.chromadb === 'unhealthy') health.status = 'degraded';
      } catch {
        health.services.chromadb = 'unhealthy';
        health.status = 'degraded';
      }

      try {
        const { checkNeo4jHealth } = await import('@/lib/neo4j');
        health.services.neo4j = (await checkNeo4jHealth()) ? 'healthy' : 'unhealthy';
        if (health.services.neo4j === 'unhealthy') health.status = 'degraded';
      } catch {
        health.services.neo4j = 'unhealthy';
        health.status = 'degraded';
      }

      try {
        const { redis } = await import('@/lib/redis');
        health.services.redis = redis.status === 'ready' ? 'healthy' : 'unhealthy';
        if (health.services.redis === 'unhealthy') health.status = 'degraded';
      } catch {
        health.services.redis = 'unhealthy';
        health.status = 'degraded';
      }

      const statusCode = health.status === 'healthy' ? 200 : 503;
      res.status(statusCode).json(health);
    })
  );

  app.get('/openapi.json', (_req: Request, res: Response) => {
    res.json(openApiSpec);
  });

  app.use(
    '/docs',
    swaggerUi.serve,
    swaggerUi.setup(openApiSpec, {
      explorer: true,
      customSiteTitle: `${config.APP_NAME} API Docs`,
    })
  );

  app.get('/api', (_req: Request, res: Response) => {
    res.json({
      name: config.APP_NAME,
      version: config.APP_VERSION,
      description: 'DCBrain API - AI Platform for Data Centre EPC',
      documentation: '/docs',
      openapi: '/openapi.json',
    });
  });

  app.use('/api', routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export { asyncHandler };
