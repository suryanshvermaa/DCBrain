import { RiskLevel, ScheduleImportStatus } from '@prisma/client';
import { assertProjectAccess } from '@/modules/projects';
import { logger } from '@/lib/logger';
import prisma from '@/lib/prisma';
import { parseP6Xml } from './parser';
import { scoreActivities, computeHealthIndicators } from './risk-engine';
import { generateMitigations } from './mitigation';

// --------------------------------------------------------------------------
// Shared actor type (mirrors compliance module pattern)
// --------------------------------------------------------------------------

export interface ScheduleActor {
  id: string;
  role: import('@prisma/client').Role;
}

// --------------------------------------------------------------------------
// Response DTOs
// --------------------------------------------------------------------------

export interface ScheduleActivityResponse {
  id: string;
  activityId: string;
  name: string;
  wbsCode: string | null;
  wbsName: string | null;
  plannedStart: string | null;
  plannedFinish: string | null;
  actualStart: string | null;
  actualFinish: string | null;
  durationDays: number;
  totalFloat: number;
  freeFloat: number;
  isCritical: boolean;
  riskScore: number;
  riskLevel: RiskLevel;
  predecessors: string[];
  mitigationActions: string[];
}

export interface ScheduleRiskSummaryResponse {
  projectId: string;
  latestImport: {
    id: string;
    filename: string;
    importedAt: string;
    activityCount: number;
  } | null;
  health: {
    totalActivities: number;
    criticalPathCount: number;
    highRiskCount: number;
    spi: number;
    floatConsumptionRate: number;
    predictedCompletionDate: string | null;
    overallRiskScore: number;
  };
  riskDistribution: {
    LOW: number;
    MEDIUM: number;
    HIGH: number;
    CRITICAL: number;
  };
}

export interface ScheduleImportResponse {
  id: string;
  filename: string;
  activityCount: number;
  status: ScheduleImportStatus;
  errorMessage: string | null;
  importedAt: string;
}

// --------------------------------------------------------------------------
// Service functions
// --------------------------------------------------------------------------

/**
 * Parse a P6 XML file, compute risk scores, generate mitigations, and persist.
 */
export async function importSchedule(input: {
  projectId: string;
  actor: ScheduleActor;
  fileBuffer: Buffer;
  filename: string;
}): Promise<{ importId: string; activityCount: number }> {
  await assertProjectAccess(input.projectId, input.actor);

  logger.info('Schedule import started', {
    projectId: input.projectId,
    filename: input.filename,
  });

  // Create an import record early so we can reference it
  const importRecord = await prisma.scheduleImport.create({
    data: {
      projectId: input.projectId,
      filename: input.filename,
      status: ScheduleImportStatus.SUCCESS,
      activityCount: 0,
    },
  });

  try {
    const parsed = parseP6Xml(input.fileBuffer);
    const scored = scoreActivities(parsed);
    const mitigationMap = await generateMitigations(scored);

    // Persist activities in a single transaction
    await prisma.$transaction(
      scored.map((activity) =>
        prisma.scheduleActivity.create({
          data: {
            projectId: input.projectId,
            importId: importRecord.id,
            activityId: activity.activityId,
            name: activity.name,
            wbsCode: activity.wbsCode,
            wbsName: activity.wbsName,
            plannedStart: activity.plannedStart,
            plannedFinish: activity.plannedFinish,
            actualStart: activity.actualStart,
            actualFinish: activity.actualFinish,
            durationDays: activity.durationDays,
            totalFloat: activity.totalFloat,
            freeFloat: activity.freeFloat,
            isCritical: activity.isCritical,
            riskScore: activity.riskScore,
            riskLevel: activity.riskLevel,
            predecessors: activity.predecessors,
            mitigationActions: mitigationMap.get(activity.activityId) ?? [],
          },
        })
      )
    );

    // Update the import record with final count
    await prisma.scheduleImport.update({
      where: { id: importRecord.id },
      data: { activityCount: scored.length, status: ScheduleImportStatus.SUCCESS },
    });

    logger.info('Schedule import completed', {
      importId: importRecord.id,
      activityCount: scored.length,
    });

    const { triggerAgentsOnEvent } = await import('@/modules/agents/triggers');
    await triggerAgentsOnEvent('schedule_imported', input.projectId, input.actor.id, {
      importId: importRecord.id,
      activityCount: scored.length,
    });

    return { importId: importRecord.id, activityCount: scored.length };
  } catch (err) {
    // Mark import as failed
    await prisma.scheduleImport.update({
      where: { id: importRecord.id },
      data: {
        status: ScheduleImportStatus.FAILED,
        errorMessage: err instanceof Error ? err.message : String(err),
      },
    });
    throw err;
  }
}

/**
 * List schedule activities for a project, with optional filters.
 */
export async function getScheduleActivities(input: {
  projectId: string;
  actor: ScheduleActor;
  riskLevel?: RiskLevel;
  isCritical?: boolean;
  limit?: number;
  offset?: number;
}): Promise<{ activities: ScheduleActivityResponse[]; total: number }> {
  await assertProjectAccess(input.projectId, input.actor);

  const where = {
    projectId: input.projectId,
    ...(input.riskLevel ? { riskLevel: input.riskLevel } : {}),
    ...(input.isCritical !== undefined ? { isCritical: input.isCritical } : {}),
  };

  const [activities, total] = await prisma.$transaction([
    prisma.scheduleActivity.findMany({
      where,
      orderBy: [{ riskScore: 'desc' }, { isCritical: 'desc' }],
      take: input.limit ?? 200,
      skip: input.offset ?? 0,
    }),
    prisma.scheduleActivity.count({ where }),
  ]);

  return {
    total,
    activities: activities.map(toActivityResponse),
  };
}

/**
 * Get the schedule risk summary including health indicators.
 */
export async function getScheduleRiskSummary(input: {
  projectId: string;
  actor: ScheduleActor;
}): Promise<ScheduleRiskSummaryResponse> {
  await assertProjectAccess(input.projectId, input.actor);

  // Latest import
  const latestImport = await prisma.scheduleImport.findFirst({
    where: { projectId: input.projectId, status: ScheduleImportStatus.SUCCESS },
    orderBy: { importedAt: 'desc' },
  });

  if (!latestImport) {
    return {
      projectId: input.projectId,
      latestImport: null,
      health: {
        totalActivities: 0,
        criticalPathCount: 0,
        highRiskCount: 0,
        spi: 1.0,
        floatConsumptionRate: 0,
        predictedCompletionDate: null,
        overallRiskScore: 0,
      },
      riskDistribution: { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 },
    };
  }

  // Aggregate from latest import
  const activities = await prisma.scheduleActivity.findMany({
    where: { importId: latestImport.id },
    select: {
      isCritical: true,
      riskScore: true,
      riskLevel: true,
      totalFloat: true,
      durationDays: true,
      plannedStart: true,
      plannedFinish: true,
      actualStart: true,
      actualFinish: true,
      activityId: true,
      name: true,
    },
  });

  // Re-use health indicator logic — pass minimal shaped objects
  const shaped = activities.map((a) => ({
    activityId: a.activityId,
    name: a.name,
    wbsCode: null,
    wbsName: null,
    plannedStart: a.plannedStart,
    plannedFinish: a.plannedFinish,
    actualStart: a.actualStart,
    actualFinish: a.actualFinish,
    durationDays: a.durationDays,
    totalFloat: a.totalFloat,
    freeFloat: 0,
    isCritical: a.isCritical,
    riskScore: a.riskScore,
    riskLevel: a.riskLevel,
    predecessors: [] as string[],
  }));

  const health = computeHealthIndicators(shaped);

  // Risk distribution
  const distribution = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
  for (const a of activities) {
    distribution[a.riskLevel]++;
  }

  return {
    projectId: input.projectId,
    latestImport: {
      id: latestImport.id,
      filename: latestImport.filename,
      importedAt: latestImport.importedAt.toISOString(),
      activityCount: latestImport.activityCount,
    },
    health,
    riskDistribution: distribution,
  };
}

/**
 * List schedule imports for a project.
 */
export async function listScheduleImports(input: {
  projectId: string;
  actor: ScheduleActor;
}): Promise<ScheduleImportResponse[]> {
  await assertProjectAccess(input.projectId, input.actor);

  const imports = await prisma.scheduleImport.findMany({
    where: { projectId: input.projectId },
    orderBy: { importedAt: 'desc' },
    take: 50,
  });

  return imports.map((imp) => ({
    id: imp.id,
    filename: imp.filename,
    activityCount: imp.activityCount,
    status: imp.status,
    errorMessage: imp.errorMessage,
    importedAt: imp.importedAt.toISOString(),
  }));
}

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

function toActivityResponse(a: {
  id: string;
  activityId: string;
  name: string;
  wbsCode: string | null;
  wbsName: string | null;
  plannedStart: Date | null;
  plannedFinish: Date | null;
  actualStart: Date | null;
  actualFinish: Date | null;
  durationDays: number;
  totalFloat: number;
  freeFloat: number;
  isCritical: boolean;
  riskScore: number;
  riskLevel: RiskLevel;
  predecessors: import('@prisma/client').Prisma.JsonValue;
  mitigationActions: import('@prisma/client').Prisma.JsonValue;
}): ScheduleActivityResponse {
  return {
    id: a.id,
    activityId: a.activityId,
    name: a.name,
    wbsCode: a.wbsCode,
    wbsName: a.wbsName,
    plannedStart: a.plannedStart?.toISOString() ?? null,
    plannedFinish: a.plannedFinish?.toISOString() ?? null,
    actualStart: a.actualStart?.toISOString() ?? null,
    actualFinish: a.actualFinish?.toISOString() ?? null,
    durationDays: a.durationDays,
    totalFloat: a.totalFloat,
    freeFloat: a.freeFloat,
    isCritical: a.isCritical,
    riskScore: a.riskScore,
    riskLevel: a.riskLevel,
    predecessors: Array.isArray(a.predecessors) ? (a.predecessors as string[]) : [],
    mitigationActions: Array.isArray(a.mitigationActions)
      ? (a.mitigationActions as string[])
      : [],
  };
}
