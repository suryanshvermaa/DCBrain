import { createApp } from './app';
import config from '@/core/config';
import { logger } from '@/lib/logger';
import { disconnectPrisma } from '@/lib/prisma';
import { disconnectRedis } from '@/lib/redis';
import { closeNeo4j } from '@/lib/neo4j';
import { initWebSocketServer } from '@/modules/notifications';
import { seedInitialAdmin } from '@/scripts/seedAdmin';

const app = createApp();

async function startServer(): Promise<void> {
  try {
    const { connectRedis } = await import('@/lib/redis');
    await connectRedis();
    logger.info('Redis connected');

    const { ensureBucketExists } = await import('@/lib/minio');
    await ensureBucketExists();
    logger.info('MinIO bucket ready');

    const { checkNeo4jHealth, initializeNeo4jSchema } = await import('@/lib/neo4j');
    const neo4jHealthy = await checkNeo4jHealth();
    if (neo4jHealthy) {
      logger.info('Neo4j connected');
      await initializeNeo4jSchema();
      logger.info('Neo4j schema initialized');
    } else {
      logger.warn('Neo4j not available');
    }

    // Seed initial admin if needed
    await seedInitialAdmin();

    const server = app.listen(config.APP_PORT, config.APP_HOST, () => {
      logger.info(`Server started`, {
        host: config.APP_HOST,
        port: config.APP_PORT,
        env: config.APP_ENV,
        version: config.APP_VERSION,
      });
    });

    initWebSocketServer(server);

    const shutdown = (signal: string): void => {
      logger.info(`${signal} received, shutting down gracefully`);

      server.close(() => {
        logger.info('HTTP server closed');

        void (async () => {
          try {
            await disconnectPrisma();
            logger.info('Prisma disconnected');
          } catch (err) {
            logger.error('Error disconnecting Prisma', { error: err });
          }

          try {
            await disconnectRedis();
            logger.info('Redis disconnected');
          } catch (err) {
            logger.error('Error disconnecting Redis', { error: err });
          }

          try {
            await closeNeo4j();
            logger.info('Neo4j closed');
          } catch (err) {
            logger.error('Error closing Neo4j', { error: err });
          }

          process.exit(0);
        })();
      });

      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

void startServer();
