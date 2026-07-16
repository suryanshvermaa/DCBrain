// @ts-nocheck
import { Worker } from 'bullmq';
import { createApp } from './app';
import config from '@/core/config';
import { logger } from '@/lib/logger';
import { connectRedis, bullMqRedis } from '@/lib/redis';
import { ensureBucketExists } from '@/lib/minio';
import { processDocumentJob } from '@/modules/documents/processing/worker';

async function startWorker(): Promise<void> {
  await connectRedis();
  await ensureBucketExists();

  const worker = new Worker(
    'document-processing',
    async (job) => processDocumentJob(job),
    {
      connection: bullMqRedis as any,
      concurrency: config.BULLMQ_WORKER_CONCURRENCY,
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 50 },
    }
  );

  const agentWorker = new Worker(
    'agent-execution',
    async (job) => {
      const { processAgentJob } = await import('@/modules/agents/worker');
      await processAgentJob(job);
    },
    {
      connection: bullMqRedis as any,
      concurrency: config.BULLMQ_WORKER_CONCURRENCY,
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 50 },
    }
  );

  const reportWorker = new Worker(
    'report-generation',
    async (job) => {
      const { executeReportGeneration } = await import('@/modules/reports/service');
      const { reportId, projectId, type, userId } = job.data;
      await executeReportGeneration(reportId, projectId, type, userId);
    },
    {
      connection: bullMqRedis as any,
      concurrency: 1, // Reports are heavy — serialize
      removeOnComplete: { count: 50 },
      removeOnFail: { count: 25 },
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

  agentWorker.on('ready', () => {
    logger.info('Agent execution worker ready');
  });

  agentWorker.on('failed', (job, err) => {
    logger.error('Agent execution job failed', { jobId: job?.id, error: err.message });
  });

  agentWorker.on('completed', (job) => {
    logger.info('Agent execution job completed', { jobId: job.id });
  });

  reportWorker.on('ready', () => {
    logger.info('Report generation worker ready');
  });

  reportWorker.on('failed', (job, err) => {
    logger.error('Report generation job failed', { jobId: job?.id, error: err.message });
  });

  reportWorker.on('completed', (job) => {
    logger.info('Report generation job completed', { jobId: job.id });
  });

  process.on('SIGINT', async () => {
    await Promise.all([worker.close(), agentWorker.close(), reportWorker.close()]);
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await Promise.all([worker.close(), agentWorker.close(), reportWorker.close()]);
    process.exit(0);
  });
}

void startWorker();
