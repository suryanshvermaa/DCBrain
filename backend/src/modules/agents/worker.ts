import type { Job } from 'bullmq';
import { logger } from '@/lib/logger';
import { getAgentInstance } from './registry';
import type { AgentJobData } from './queue';

export async function processAgentJob(job: Job<AgentJobData>): Promise<void> {
  const { projectId, agentType, input, userId } = job.data;
  
  logger.info(`Worker picked up agent execution job`, { jobId: job.id, agentType, projectId });

  const agent = getAgentInstance(agentType);
  if (!agent) {
    throw new Error(`Agent ${agentType} not found in registry`);
  }

  try {
    const output = await agent.execute(input, userId);
    if (!output.success) {
      throw new Error(output.content || `Agent ${agentType} execution failed`);
    }
    logger.info(`Worker finished agent execution job`, { jobId: job.id, agentType, projectId });
  } catch (error: any) {
    logger.error(`Worker failed agent execution job`, { jobId: job.id, agentType, error: error.message });
    throw error;
  }
}
