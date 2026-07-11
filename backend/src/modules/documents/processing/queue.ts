import { Queue } from 'bullmq';
import type { ProcessDocumentJobData } from './worker';

const queueOptions = {
  connection: {
    host: '127.0.0.1',
    port: 6379,
    lazyConnect: true,
  },
};

const isTestEnvironment = process.env['APP_ENV'] === 'test' || process.env['NODE_ENV'] === 'test';

export const documentProcessingQueue = isTestEnvironment
  ? ({ add: async () => ({ id: 'test-job', name: 'test-job', data: {} as ProcessDocumentJobData }) } as unknown as Pick<Queue<ProcessDocumentJobData>, 'add'>)
  : new Queue<ProcessDocumentJobData>('document-processing', queueOptions as never);

export async function enqueueDocumentProcessing(document: ProcessDocumentJobData): Promise<void> {
  await documentProcessingQueue.add(`document-${document.documentId}`, document, {
    attempts: 3,
    backoff: {
      type: 'exponential' as const,
      delay: 2000,
    },
    removeOnComplete: true,
  } as never);
}
