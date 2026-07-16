import { Prisma, ChangeOrderStatus, type Role, type ChangeOrder } from '@prisma/client';
import { assertProjectAccess } from '@/modules/projects';
import { BadRequestError, NotFoundError } from '@/core/errors';
import { logger } from '@/lib/logger';
import prisma from '@/lib/prisma';
import type { CreateCoInput, UpdateCoInput } from './schemas';

export interface CoActor {
  id: string;
  role: Role;
}

export interface CoResponse {
  id: string;
  number: string;
  title: string;
  description: string;
  reason: string | null;
  costImpact: number;
  scheduleImpactDays: number;
  status: ChangeOrderStatus;
  approvedById: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  documentId: string | null;
  scheduleActivityId: string | null;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CoSummaryResponse {
  total: number;
  byStatus: Record<ChangeOrderStatus, number>;
  totalCostImpact: number;
  totalScheduleImpactDays: number;
  approvedCount: number;
  pendingCount: number;
}

function toCoResponse(co: ChangeOrder): CoResponse {
  return {
    id: co.id,
    number: co.number,
    title: co.title,
    description: co.description,
    reason: co.reason,
    costImpact: co.costImpact,
    scheduleImpactDays: co.scheduleImpactDays,
    status: co.status,
    approvedById: co.approvedById,
    approvedAt: co.approvedAt?.toISOString() ?? null,
    rejectedAt: co.rejectedAt?.toISOString() ?? null,
    documentId: co.documentId,
    scheduleActivityId: co.scheduleActivityId,
    projectId: co.projectId,
    createdAt: co.createdAt.toISOString(),
    updatedAt: co.updatedAt.toISOString(),
  };
}

async function nextCoNumber(projectId: string): Promise<string> {
  const count = await prisma.changeOrder.count({ where: { projectId } });
  return `CO-${String(count + 1).padStart(4, '0')}`;
}

const ALLOWED_CO_TRANSITIONS: Record<ChangeOrderStatus, ChangeOrderStatus[]> = {
  DRAFT: [ChangeOrderStatus.PENDING_APPROVAL, ChangeOrderStatus.CANCELLED],
  PENDING_APPROVAL: [ChangeOrderStatus.APPROVED, ChangeOrderStatus.REJECTED, ChangeOrderStatus.DRAFT],
  APPROVED: [],
  REJECTED: [ChangeOrderStatus.DRAFT],
  CANCELLED: [],
};

export function canCoTransition(from: ChangeOrderStatus, to: ChangeOrderStatus): boolean {
  if (from === to) return true;
  return ALLOWED_CO_TRANSITIONS[from].includes(to);
}

export async function createChangeOrder(input: {
  projectId: string;
  actor: CoActor;
  data: CreateCoInput;
}): Promise<CoResponse> {
  await assertProjectAccess(input.projectId, input.actor);

  for (let attempt = 0; attempt < 3; attempt++) {
    const number = await nextCoNumber(input.projectId);
    try {
      const created = await prisma.changeOrder.create({
        data: {
          projectId: input.projectId,
          number,
          title: input.data.title,
          description: input.data.description,
          reason: input.data.reason ?? null,
          costImpact: input.data.costImpact ?? 0,
          scheduleImpactDays: input.data.scheduleImpactDays ?? 0,
          documentId: input.data.documentId ?? null,
          scheduleActivityId: input.data.scheduleActivityId ?? null,
        },
      });

      logger.info('Change order created', {
        projectId: input.projectId,
        coId: created.id,
        number,
      });
      return toCoResponse(created);
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002' &&
        attempt < 2
      ) {
        logger.warn('CO number collision, retrying', { projectId: input.projectId, number });
        continue;
      }
      throw err;
    }
  }

  throw new BadRequestError('Unable to allocate a Change Order number, please retry');
}

export async function listChangeOrders(input: {
  projectId: string;
  actor: CoActor;
  status?: ChangeOrderStatus;
  limit?: number;
  offset?: number;
}): Promise<{ changeOrders: CoResponse[]; total: number }> {
  await assertProjectAccess(input.projectId, input.actor);

  const where: Prisma.ChangeOrderWhereInput = {
    projectId: input.projectId,
    ...(input.status ? { status: input.status } : {}),
  };

  const [changeOrders, total] = await prisma.$transaction([
    prisma.changeOrder.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }],
      take: input.limit ?? 200,
      skip: input.offset ?? 0,
    }),
    prisma.changeOrder.count({ where }),
  ]);

  return { total, changeOrders: changeOrders.map(toCoResponse) };
}

export async function getChangeOrder(input: {
  projectId: string;
  actor: CoActor;
  coId: string;
}): Promise<CoResponse> {
  await assertProjectAccess(input.projectId, input.actor);

  const co = await prisma.changeOrder.findFirst({
    where: { id: input.coId, projectId: input.projectId },
  });
  if (!co) throw new NotFoundError('Change Order', input.coId);

  return toCoResponse(co);
}

export async function updateChangeOrder(input: {
  projectId: string;
  actor: CoActor;
  coId: string;
  data: UpdateCoInput;
}): Promise<CoResponse> {
  await assertProjectAccess(input.projectId, input.actor);

  const existing = await prisma.changeOrder.findFirst({
    where: { id: input.coId, projectId: input.projectId },
  });
  if (!existing) throw new NotFoundError('Change Order', input.coId);

  const now = new Date();
  const updateData: Prisma.ChangeOrderUpdateInput = {};

  if (input.data.title !== undefined) updateData.title = input.data.title;
  if (input.data.description !== undefined) updateData.description = input.data.description;
  if (input.data.reason !== undefined) updateData.reason = input.data.reason;
  if (input.data.costImpact !== undefined) updateData.costImpact = input.data.costImpact;
  if (input.data.scheduleImpactDays !== undefined) updateData.scheduleImpactDays = input.data.scheduleImpactDays;
  if (input.data.documentId !== undefined) updateData.documentId = input.data.documentId;
  if (input.data.scheduleActivityId !== undefined) updateData.scheduleActivityId = input.data.scheduleActivityId;

  if (input.data.status !== undefined && input.data.status !== existing.status) {
    if (!canCoTransition(existing.status, input.data.status)) {
      throw new BadRequestError(
        `Invalid Change Order status transition: ${existing.status} → ${input.data.status}`
      );
    }
    if (input.data.status === ChangeOrderStatus.APPROVED) {
      updateData.approvedById = input.actor.id;
      updateData.approvedAt = now;
    }
    if (input.data.status === ChangeOrderStatus.REJECTED) {
      updateData.rejectedAt = now;
    }
    updateData.status = input.data.status;
  }

  const updated = await prisma.changeOrder.update({
    where: { id: input.coId },
    data: updateData,
  });

  logger.info('Change order updated', { projectId: input.projectId, coId: input.coId });
  return toCoResponse(updated);
}

export async function getChangeOrderSummary(input: {
  projectId: string;
  actor: CoActor;
}): Promise<CoSummaryResponse> {
  await assertProjectAccess(input.projectId, input.actor);

  const cos = await prisma.changeOrder.findMany({
    where: { projectId: input.projectId },
    select: { status: true, costImpact: true, scheduleImpactDays: true },
  });

  const byStatus: Record<ChangeOrderStatus, number> = {
    DRAFT: 0,
    PENDING_APPROVAL: 0,
    APPROVED: 0,
    REJECTED: 0,
    CANCELLED: 0,
  };

  let totalCostImpact = 0;
  let totalScheduleImpactDays = 0;

  for (const co of cos) {
    byStatus[co.status]++;
    // Only count approved COs in impact totals
    if (co.status === ChangeOrderStatus.APPROVED) {
      totalCostImpact += co.costImpact;
      totalScheduleImpactDays += co.scheduleImpactDays;
    }
  }

  return {
    total: cos.length,
    byStatus,
    totalCostImpact: Math.round(totalCostImpact * 100) / 100,
    totalScheduleImpactDays,
    approvedCount: byStatus.APPROVED,
    pendingCount: byStatus.PENDING_APPROVAL,
  };
}
