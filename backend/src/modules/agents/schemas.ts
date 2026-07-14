import { z } from 'zod';

export const agentTypeEnum = z.enum([
  'SUPERVISOR',
  'DOCUMENT',
  'KNOWLEDGE',
  'COMPLIANCE',
  'SCHEDULE_RISK',
  'PROCUREMENT',
  'PROJECT_HEALTH',
  'DATA_VALIDATION',
  'COMMISSIONING',
  'RISK_ANALYSIS',
  'EXECUTIVE_COPILOT',
  'REPORTING',
  'RECOMMENDATION',
  'MITIGATION_PLANNER',
]);

export const projectAgentParamsSchema = z.object({
  id: z.string().min(1, 'Project ID is required'),
});

export const runAgentParamsSchema = z.object({
  id: z.string().min(1, 'Project ID is required'),
  type: agentTypeEnum,
});

export const runAgentBodySchema = z.object({
  query: z.string().optional(),
  documentIds: z.array(z.string()).optional(),
  standards: z.array(z.string()).optional(),
  notes: z.string().optional(),
  runAsync: z.boolean().default(true),
});

export const updateAgentScheduleBodySchema = z.object({
  agentType: agentTypeEnum,
  schedule: z.string().min(1, 'Cron expression is required'),
  isActive: z.boolean().default(true),
});
