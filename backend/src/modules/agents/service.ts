import { prisma } from '@/lib/prisma';
import { getAgentInstance, getAllAgents } from './registry';
import { enqueueAgentExecution } from './queue';
import type { AgentType, AgentInput, AgentOutput } from './agent.types';
import { agentExecutionQueue } from './queue';
import { logger } from '@/lib/logger';

export async function listAgents(projectId: string) {
  const agents = getAllAgents();
  const [schedules, latestRuns] = await Promise.all([
    prisma.agentSchedule.findMany({ where: { projectId } }),
    prisma.agentRun.findMany({
      where: { projectId },
      distinct: ['agentType'],
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const scheduleMap = new Map(schedules.map((s) => [s.agentType, s]));
  const latestRunMap = new Map(latestRuns.map((r) => [r.agentType, r]));

  return agents.map((agent) => {
    const schedule = scheduleMap.get(agent.type);
    const latestRun = latestRunMap.get(agent.type);

    return {
      type: agent.type,
      name: agent.name,
      schedule: schedule ? { cron: schedule.schedule, isActive: schedule.isActive } : null,
      latestRun: latestRun
        ? {
            id: latestRun.id,
            status: latestRun.status,
            createdAt: latestRun.createdAt,
            durationMs: latestRun.durationMs,
          }
        : null,
    };
  });
}

export async function runAgentService(input: {
  projectId: string;
  agentType: AgentType;
  input: AgentInput;
  userId?: string;
  runAsync?: boolean;
}): Promise<{ runId: string; status: string; output?: AgentOutput }> {
  const agent = getAgentInstance(input.agentType);
  if (!agent) {
    throw new Error(`Agent ${input.agentType} is not registered`);
  }

  if (input.runAsync) {
    // Write a pending run record first
    const run = await prisma.agentRun.create({
      data: {
        projectId: input.projectId,
        agentType: input.agentType,
        status: 'PENDING',
        input: input.input as any,
        triggeredById: input.userId || null,
      },
    });

    // Enqueue background BullMQ job
    await enqueueAgentExecution({
      projectId: input.projectId,
      agentType: input.agentType,
      input: input.input,
      userId: input.userId,
    });

    return {
      runId: run.id,
      status: 'PENDING',
    };
  } else {
    // Run synchronously
    const output = await agent.execute(input.input, input.userId);
    const run = await prisma.agentRun.findFirst({
      where: { projectId: input.projectId, agentType: input.agentType },
      orderBy: { createdAt: 'desc' },
    });

    return {
      runId: run?.id || 'sync',
      status: output.success ? 'COMPLETED' : 'FAILED',
      output,
    };
  }
}

export async function listAgentRuns(projectId: string, agentType?: AgentType) {
  return prisma.agentRun.findMany({
    where: {
      projectId,
      ...(agentType ? { agentType } : {}),
    },
    orderBy: { createdAt: 'desc' },
    include: {
      triggeredBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });
}

export async function getAgentRunDetails(runId: string) {
  return prisma.agentRun.findUnique({
    where: { id: runId },
    include: {
      triggeredBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });
}

export async function updateAgentScheduleService(input: {
  projectId: string;
  agentType: AgentType;
  schedule: string;
  isActive: boolean;
}) {
  const { projectId, agentType, schedule, isActive } = input;

  const record = await prisma.agentSchedule.upsert({
    where: { projectId_agentType: { projectId, agentType } },
    update: { schedule, isActive },
    create: { projectId, agentType, schedule, isActive },
  });

  // Try to schedule repeatable jobs in BullMQ (if redis is active and not in tests)
  if ('getRepeatableJobs' in agentExecutionQueue) {
    try {
      const q = agentExecutionQueue as any;
      const repeatableJobs = await q.getRepeatableJobs();
      const jobKey = `agent-schedule-${projectId}-${agentType}`;
      
      const existing = repeatableJobs.find((job: any) => job.id === jobKey);
      if (existing) {
        await q.removeRepeatableByKey(existing.key);
      }

      if (isActive && schedule) {
        await q.add(
          `agent-${agentType}-scheduled`,
          { projectId, agentType, input: { projectId } },
          {
            jobId: jobKey,
            repeat: { pattern: schedule },
          }
        );
        logger.info(`Scheduled repeatable agent job`, { projectId, agentType, cron: schedule });
      }
    } catch (err: any) {
      logger.error('Failed to configure repeatable agent schedule in BullMQ', { error: err.message });
    }
  }

  return record;
}
