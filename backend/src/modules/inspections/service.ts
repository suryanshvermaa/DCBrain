import { Prisma, InspectionStatus, ActivityType, type Role } from '@prisma/client';
import { assertProjectAccess } from '@/modules/projects';
import { NotFoundError } from '@/core/errors';
import { logger } from '@/lib/logger';
import prisma from '@/lib/prisma';
import type { CreateInspectionInput, UpdateInspectionInput } from './schemas';

export interface InspectionActor {
  id: string;
  role: Role;
}

export interface InspectionResponse {
  id: string;
  itpRef: string | null;
  title: string;
  discipline: string | null;
  holdPoint: boolean;
  inspector: string | null;
  scheduledDate: string | null;
  completedDate: string | null;
  status: InspectionStatus;
  result: string | null;
  vendorId: string | null;
  documentId: string | null;
  projectId: string;
  overdue: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InspectionSummaryResponse {
  total: number;
  byStatus: Record<InspectionStatus, number>;
  passRate: number;
  overdueHoldPoints: number;
  byDiscipline: Record<string, number>;
}

function isInspectionOverdue(insp: { scheduledDate: Date | null; status: InspectionStatus }, now: Date): boolean {
  if (!insp.scheduledDate) return false;
  const terminal: InspectionStatus[] = [InspectionStatus.PASSED, InspectionStatus.FAILED, InspectionStatus.WAIVED];
  if (terminal.includes(insp.status)) return false;
  return insp.scheduledDate.getTime() < now.getTime();
}

function toInspectionResponse(
  insp: Prisma.InspectionGetPayload<object>,
  now: Date = new Date()
): InspectionResponse {
  return {
    id: insp.id,
    itpRef: insp.itpRef,
    title: insp.title,
    discipline: insp.discipline,
    holdPoint: insp.holdPoint,
    inspector: insp.inspector,
    scheduledDate: insp.scheduledDate?.toISOString() ?? null,
    completedDate: insp.completedDate?.toISOString() ?? null,
    status: insp.status,
    result: insp.result,
    vendorId: insp.vendorId,
    documentId: insp.documentId,
    projectId: insp.projectId,
    overdue: isInspectionOverdue(insp, now),
    createdAt: insp.createdAt.toISOString(),
    updatedAt: insp.updatedAt.toISOString(),
  };
}

export async function createInspection(input: {
  projectId: string;
  actor: InspectionActor;
  data: CreateInspectionInput;
}): Promise<InspectionResponse> {
  await assertProjectAccess(input.projectId, input.actor);

  const created = await prisma.inspection.create({
    data: {
      projectId: input.projectId,
      title: input.data.title,
      itpRef: input.data.itpRef ?? null,
      discipline: input.data.discipline ?? null,
      holdPoint: input.data.holdPoint ?? false,
      inspector: input.data.inspector ?? null,
      scheduledDate: input.data.scheduledDate ?? null,
      vendorId: input.data.vendorId ?? null,
      documentId: input.data.documentId ?? null,
    },
  });

  try {
    await prisma.activity.create({
      data: {
        projectId: input.projectId,
        userId: input.actor.id,
        type: ActivityType.INSPECTION_SCHEDULED,
        title: `Inspection "${created.title}" scheduled`,
        description: created.discipline ?? undefined,
        metadata: { inspectionId: created.id },
      },
    });
  } catch (err) {
    logger.warn('Failed to log inspection activity', { error: (err as Error).message });
  }

  logger.info('Inspection created', { projectId: input.projectId, inspectionId: created.id });
  return toInspectionResponse(created);
}

export async function listInspections(input: {
  projectId: string;
  actor: InspectionActor;
  status?: InspectionStatus;
  discipline?: string;
  holdPoint?: boolean;
  overdue?: boolean;
  limit?: number;
  offset?: number;
}): Promise<{ inspections: InspectionResponse[]; total: number }> {
  await assertProjectAccess(input.projectId, input.actor);

  const now = new Date();
  const where: Prisma.InspectionWhereInput = {
    projectId: input.projectId,
    ...(input.status ? { status: input.status } : {}),
    ...(input.discipline ? { discipline: input.discipline } : {}),
    ...(input.holdPoint !== undefined ? { holdPoint: input.holdPoint } : {}),
    ...(input.overdue === true
      ? {
          scheduledDate: { lt: now },
          status: { notIn: [InspectionStatus.PASSED, InspectionStatus.FAILED, InspectionStatus.WAIVED] },
        }
      : {}),
  };

  const [inspections, total] = await prisma.$transaction([
    prisma.inspection.findMany({
      where,
      orderBy: [{ scheduledDate: 'asc' }, { createdAt: 'desc' }],
      take: input.limit ?? 200,
      skip: input.offset ?? 0,
    }),
    prisma.inspection.count({ where }),
  ]);

  return { total, inspections: inspections.map((i) => toInspectionResponse(i, now)) };
}

export async function getInspection(input: {
  projectId: string;
  actor: InspectionActor;
  inspId: string;
}): Promise<InspectionResponse> {
  await assertProjectAccess(input.projectId, input.actor);

  const insp = await prisma.inspection.findFirst({
    where: { id: input.inspId, projectId: input.projectId },
  });
  if (!insp) throw new NotFoundError('Inspection', input.inspId);

  return toInspectionResponse(insp);
}

export async function updateInspection(input: {
  projectId: string;
  actor: InspectionActor;
  inspId: string;
  data: UpdateInspectionInput;
}): Promise<InspectionResponse> {
  await assertProjectAccess(input.projectId, input.actor);

  const existing = await prisma.inspection.findFirst({
    where: { id: input.inspId, projectId: input.projectId },
  });
  if (!existing) throw new NotFoundError('Inspection', input.inspId);

  const updateData: Prisma.InspectionUpdateInput = {};
  if (input.data.title !== undefined) updateData.title = input.data.title;
  if (input.data.itpRef !== undefined) updateData.itpRef = input.data.itpRef;
  if (input.data.discipline !== undefined) updateData.discipline = input.data.discipline;
  if (input.data.holdPoint !== undefined) updateData.holdPoint = input.data.holdPoint;
  if (input.data.inspector !== undefined) updateData.inspector = input.data.inspector;
  if (input.data.scheduledDate !== undefined) updateData.scheduledDate = input.data.scheduledDate;
  if (input.data.completedDate !== undefined) updateData.completedDate = input.data.completedDate;
  if (input.data.status !== undefined) updateData.status = input.data.status;
  if (input.data.result !== undefined) updateData.result = input.data.result;
  if (input.data.vendorId !== undefined) updateData.vendorId = input.data.vendorId;
  if (input.data.documentId !== undefined) updateData.documentId = input.data.documentId;

  const updated = await prisma.inspection.update({
    where: { id: input.inspId },
    data: updateData,
  });

  logger.info('Inspection updated', { projectId: input.projectId, inspId: input.inspId });
  return toInspectionResponse(updated);
}

export async function getInspectionSummary(input: {
  projectId: string;
  actor: InspectionActor;
}): Promise<InspectionSummaryResponse> {
  await assertProjectAccess(input.projectId, input.actor);

  const now = new Date();
  const inspections = await prisma.inspection.findMany({
    where: { projectId: input.projectId },
    select: { status: true, discipline: true, holdPoint: true, scheduledDate: true },
  });

  const byStatus: Record<InspectionStatus, number> = {
    SCHEDULED: 0,
    IN_PROGRESS: 0,
    PASSED: 0,
    FAILED: 0,
    ON_HOLD: 0,
    WAIVED: 0,
  };
  const byDiscipline: Record<string, number> = {};
  let overdueHoldPoints = 0;

  for (const insp of inspections) {
    byStatus[insp.status]++;
    const disc = insp.discipline ?? 'Unknown';
    byDiscipline[disc] = (byDiscipline[disc] ?? 0) + 1;
    if (insp.holdPoint && isInspectionOverdue(insp, now)) {
      overdueHoldPoints++;
    }
  }

  const completed = byStatus.PASSED + byStatus.FAILED + byStatus.WAIVED;
  const passRate =
    completed > 0 ? Math.round((byStatus.PASSED / completed) * 100) : 0;

  return {
    total: inspections.length,
    byStatus,
    passRate,
    overdueHoldPoints,
    byDiscipline,
  };
}
