import { Queue } from 'bullmq';
import { bullMqRedis } from '@/lib/redis';
import { logger } from '@/lib/logger';
import type { ReportType } from '@prisma/client';

export interface ReportJobData {
  reportId: string;
  projectId: string;
  type: ReportType;
  userId?: string;
}

let reportQueue: Queue<ReportJobData> | null = null;

export function getReportQueue(): Queue<ReportJobData> {
  if (!reportQueue) {
    reportQueue = new Queue<ReportJobData>('report-generation', {
      connection: bullMqRedis as any,
      defaultJobOptions: {
        removeOnComplete: { count: 50 },
        removeOnFail: { count: 25 },
        attempts: 2,
        backoff: { type: 'exponential', delay: 5000 },
      },
    });
  }
  return reportQueue;
}

export async function enqueueReportGeneration(data: ReportJobData): Promise<string> {
  const queue = getReportQueue();
  const job = await queue.add(`report-${data.type}-${data.reportId}`, data);
  logger.info('Report generation job enqueued', { jobId: job.id, reportId: data.reportId, type: data.type });
  return job.id!;
}
