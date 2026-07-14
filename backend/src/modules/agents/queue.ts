import { Queue } from 'bullmq';
import { bullMqRedis } from '@/lib/redis';
import type { AgentType } from './agent.types';

export interface AgentJobData {
  projectId: string;
  agentType: AgentType;
  input: any;
  userId?: string;
}

const queueOptions = {
  connection: bullMqRedis as any,
};

const isTestEnvironment = process.env['APP_ENV'] === 'test' || process.env['NODE_ENV'] === 'test';

export const agentExecutionQueue = isTestEnvironment
  ? ({ add: async () => ({ id: 'test-agent-job', name: 'test-agent-job', data: {} as AgentJobData }) } as unknown as Pick<Queue<AgentJobData>, 'add'>)
  : new Queue<AgentJobData>('agent-execution', queueOptions as never);

export async function enqueueAgentExecution(data: AgentJobData): Promise<string> {
  const job = await agentExecutionQueue.add(`agent-${data.agentType}-${Date.now()}`, data, {
    attempts: 3,
    backoff: {
      type: 'exponential' as const,
      delay: 2000,
    },
    removeOnComplete: true,
  } as never);
  return job.id || 'queued-job';
}
