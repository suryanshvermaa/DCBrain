import { logger } from '@/lib/logger';
import { enqueueAgentExecution } from './queue';
import type { AgentType } from './agent.types';

export type AgentTriggerEvent = 'document_processed' | 'schedule_imported' | 'procurement_imported';

const EVENT_AGENT_MAP: Record<AgentTriggerEvent, AgentType[]> = {
  document_processed: ['DOCUMENT', 'DATA_VALIDATION'],
  schedule_imported: ['SCHEDULE_RISK', 'PROJECT_HEALTH'],
  procurement_imported: ['PROCUREMENT', 'PROJECT_HEALTH'],
};

export async function triggerAgentsOnEvent(
  event: AgentTriggerEvent,
  projectId: string,
  userId?: string,
  extra?: Record<string, unknown>
): Promise<void> {
  const agents = EVENT_AGENT_MAP[event];

  for (const agentType of agents) {
    try {
      await enqueueAgentExecution({
        projectId,
        agentType,
        input: { projectId, ...extra },
        userId,
      });
      logger.info('Auto-triggered agent on event', { event, agentType, projectId });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error('Failed to auto-trigger agent', { event, agentType, projectId, error: message });
    }
  }
}
