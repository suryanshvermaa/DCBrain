import { Worker } from 'bullmq';
import { createApp } from './app';
import config from '@/core/config';
import { logger } from '@/lib/logger';
import { connectRedis, redis } from '@/lib/redis';
import { ensureBucketExists } from '@/lib/minio';
import { processDocumentJob } from '@/modules/documents/processing/worker';

async function startWorker(): Promise<void> {
  await connectRedis();
  await ensureBucketExists();

  const worker = new Worker(
    'document-processing',
    async (job) => processDocumentJob(job),
    {
      connection: redis,
      concurrency: config.BULLMQ_WORKER_CONCURRENCY,
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 50 },
    }
  );

  worker.on('ready', () => {
    logger.info('Document processing worker ready');
  });

  worker.on('failed', (job, err) => {
    logger.error('Document processing job failed', { jobId: job?.id, error: err.message });
  });

  worker.on('completed', (job) => {
    logger.info('Document processing job completed', { jobId: job.id });
  });

  process.on('SIGINT', async () => {
    await worker.close();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await worker.close();
    process.exit(0);
  });
}

void startWorker();
