import Redis from 'ioredis';
import config from '@/core/config';
import { logger } from '@/lib/logger';

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

export const redis =
  globalForRedis.redis ??
  new Redis(config.REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => {
      if (times > 3) {
        logger.error('Redis connection failed after 3 retries');
        return null;
      }
      return Math.min(times * 200, 2000);
    },
    lazyConnect: true,
  });

export const bullMqRedis = new Redis(config.REDIS_URL, {
  maxRetriesPerRequest: null,
});

redis.on('connect', () => {
  logger.info('Redis connected');
});

redis.on('error', (err) => {
  logger.error('Redis error', { error: err.message });
});

redis.on('close', () => {
  logger.warn('Redis connection closed');
});

redis.on('reconnecting', () => {
  logger.info('Redis reconnecting...');
});

if (process.env['NODE_ENV'] !== 'production') {
  globalForRedis.redis = redis;
}

export async function connectRedis(): Promise<void> {
  if (redis.status === 'wait') {
    try {
      await redis.connect();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.warn('Redis unavailable, continuing without cache backend', { error: message });
    }
  }
}

export async function disconnectRedis(): Promise<void> {
  await redis.quit();
}

export default redis;
