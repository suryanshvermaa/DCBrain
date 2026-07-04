import type { Prisma } from '@prisma/client';
import { PrismaClient } from '@prisma/client';
import config from '@/core/config';
import { logger } from '@/lib/logger';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: [
      { level: 'query', emit: 'event' },
      { level: 'error', emit: 'event' },
      { level: 'warn', emit: 'event' },
    ],
    errorFormat: 'pretty',
  });

// Prisma's generated $on overloads do not infer event names in this strict TypeScript
// configuration, but the runtime API accepts these event names correctly.
// @ts-expect-error generated $on event type inference limitation
prisma.$on('query', (e: Prisma.QueryEvent) => {
  if (!config.DATABASE_ECHO) {
    return;
  }
  logger.debug('Query executed', {
    query: e.query,
    params: e.params,
    duration: `${e.duration}ms`,
  });
});

// @ts-expect-error generated $on event type inference limitation
prisma.$on('error', (e: Prisma.LogEvent) => {
  logger.error('Prisma error', { error: e.message, target: e['target'] });
});

// @ts-expect-error generated $on event type inference limitation
prisma.$on('warn', (e: Prisma.LogEvent) => {
  logger.warn('Prisma warning', { message: e.message, target: e['target'] });
});

if (process.env['NODE_ENV'] !== 'production') {
  globalForPrisma.prisma = prisma;
}

export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
}

export default prisma;
