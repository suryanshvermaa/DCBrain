import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { graphService } from '@/modules/graph/service';
import { runAgentService } from '@/modules/agents/service';
import { SimulationStatus } from '@prisma/client';

export interface SimulationInput {
  projectId: string;
  name: string;
  description?: string;
  targetActivityId: string;
  delayDays: number;
  assumptions?: Record<string, any>;
  userId: string;
}

export async function createAndRunSimulation(input: SimulationInput) {
  logger.info(`Starting simulation: ${input.name} on ${input.targetActivityId}`);
  
  const sim = await prisma.simulation.create({
    data: {
      projectId: input.projectId,
      name: input.name,
      description: input.description,
      targetActivityId: input.targetActivityId,
      delayDays: input.delayDays,
      assumptions: input.assumptions || {},
      createdById: input.userId,
      status: SimulationStatus.RUNNING,
    },
  });

  try {
    const targetActivity = await prisma.scheduleActivity.findFirst({
      where: { projectId: input.projectId, activityId: input.targetActivityId },
    });

    if (!targetActivity) {
      throw new Error(`Activity ${input.targetActivityId} not found in project ${input.projectId}`);
    }

    // Graph cascade
    const graphResult = await graphService.getFailurePropagation(input.projectId, targetActivity.name, 5);
    
    // Filter out the root node
    const impactedNodes = graphResult.nodes.filter(
      n => n.properties.name?.toUpperCase() !== targetActivity.name.toUpperCase()
    );
    
    const costPerDayPerNode = input.assumptions?.['costPerDay'] || 5000;
    const estimatedCostImpact = impactedNodes.length * input.delayDays * costPerDayPerNode;
    
    const impacts = impactedNodes.map(node => ({
      entityName: node.properties.name,
      labels: node.labels,
      estimatedDelayDays: input.delayDays,
    }));

    await prisma.simulation.update({
      where: { id: sim.id },
      data: {
        status: SimulationStatus.COMPLETED,
        impacts,
        costImpact: estimatedCostImpact,
        timeImpactDays: input.delayDays,
      },
    });

    return { id: sim.id };
  } catch (error: any) {
    logger.error('Simulation failed', { simId: sim.id, error: error.message });
    await prisma.simulation.update({
      where: { id: sim.id },
      data: {
        status: SimulationStatus.FAILED,
        error: error.message,
      },
    });
    throw error;
  }
}

export async function generateMitigationPlan(projectId: string, simId: string, userId: string) {
  const sim = await prisma.simulation.findUnique({
    where: { id: simId, projectId },
  });

  if (!sim) throw new Error('Simulation not found');
  if (sim.status !== 'COMPLETED') throw new Error('Simulation is not completed');

  const agentRun = await runAgentService({
    projectId,
    agentType: 'MITIGATION_PLANNER',
    userId,
    input: {
      projectId,
      simulationData: {
        delayDays: sim.delayDays,
        targetActivityId: sim.targetActivityId,
        impacts: sim.impacts,
        costImpact: sim.costImpact,
      }
    } as any,
    runAsync: false, 
  });

  if (agentRun.status === 'COMPLETED' && agentRun.output?.content) {
    await prisma.simulation.update({
      where: { id: sim.id },
      data: {
        mitigationPlans: { content: agentRun.output.content },
      },
    });
    return { content: agentRun.output.content };
  }

  throw new Error('Mitigation planner agent failed to generate plans');
}

export async function listSimulations(projectId: string) {
  return prisma.simulation.findMany({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getSimulation(projectId: string, simId: string) {
  return prisma.simulation.findUnique({
    where: { id: simId, projectId },
  });
}
