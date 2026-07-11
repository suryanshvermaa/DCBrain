import { Queue } from 'bullmq';
import { redis } from './src/lib/redis';
import config from './src/core/config';

async function retryFailedJobs() {
  const connection = {
    host: new URL(config.BULLMQ_BROKER_URL).hostname,
    port: parseInt(new URL(config.BULLMQ_BROKER_URL).port || '6379'),
  };
  const queue = new Queue('document-processing', { connection });
  
  const failedJobs = await queue.getFailed();
  console.log(`Found ${failedJobs.length} failed jobs. Retrying...`);
  
  for (const job of failedJobs) {
    await job.retry();
    console.log(`Retried job ${job.id}`);
  }
  
  await queue.close();
}

retryFailedJobs().catch(console.error).finally(() => process.exit(0));
