import { Prisma, NcrStatus, NcrSeverity, ActivityType, type Role, type Ncr } from '@prisma/client';
import { assertProjectAccess } from '@/modules/projects';
import { BadRequestError, NotFoundError } from '@/core/errors';
import { logger } from '@/lib/logger';
import prisma from '@/lib/prisma';
import type { CreateNcrInput, UpdateNcrInput } from './schemas';

// --------------------------------------------------------------------------
// Actor type
// --------------------------------------------------------------------------

export interface NcrActor {
  id: string;
  role: Role;
}

// --------------------------------------------------------------------------
// Status transition rules
// --------------------------------------------------------------------------

const ALLOWED_NCR_TRANSITIONS: Record<NcrStatus, NcrStatus[]> = {
  OPEN: [NcrStatus.UNDER_REVIEW, NcrStatus.VOID],
  UNDER_REVIEW: [NcrStatus.OPEN, NcrStatus.RESOLVED, NcrStatus.VOID],
  RESOLVED: [NcrStatus.UNDER_REVIEW, NcrStatus.CLOSED],
  CLOSED: [],
  VOID: [],
};

export function canNcrTransition(from: NcrStatus, to: NcrStatus): boolean {
  if (from === to) return true;
  return ALLOWED_NCR_TRANSITIONS[from].includes(to);
}

// --------------------------------------------------------------------------
// Response DTO
// --------------------------------------------------------------------------

export interface NcrResponse {
  id: string;
  number: string;
  title: string;
  description: string;
  severity: NcrSeverity;
  status: NcrStatus;
  discipline: string | null;
  rootCause: string | null;
  resolutionNote: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
  raisedById: string | null;
  documentId: string | null;
  rfiId: string | null;
  vendorId: string | null;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

export interface NcrAnalyticsResponse {
  total: number;
  byStatus: Record<NcrStatus, number>;
  bySeverity: Record<NcrSeverity, number>;
  open: number;
  resolved: number;
}

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

function toNcrResponse(ncr: Ncr): NcrResponse {
  return {
    id: ncr.id,
    number: ncr.number,
    title: ncr.title,
    description: ncr.description,
    severity: ncr.severity,
    status: ncr.status,
    discipline: ncr.discipline,
    rootCause: ncr.rootCause,
    resolutionNote: ncr.resolutionNote,
    resolvedAt: ncr.resolvedAt?.toISOString() ?? null,
    closedAt: ncr.closedAt?.toISOString() ?? null,
    raisedById: ncr.raisedById,
    documentId: ncr.documentId,
    rfiId: ncr.rfiId,
    vendorId: ncr.vendorId,
    projectId: ncr.projectId,
    createdAt: ncr.createdAt.toISOString(),
    updatedAt: ncr.updatedAt.toISOString(),
  };
}

async function nextNcrNumber(projectId: string): Promise<string> {
  const latest = await prisma.ncr.findFirst({
    where: { projectId },
    orderBy: { number: 'desc' },
  });
  if (!latest) return 'NCR-0001';
  const match = latest.number.match(/\d+$/);
  const nextNum = match ? parseInt(match[0], 10) + 1 : (await prisma.ncr.count({ where: { projectId } })) + 1;
  return `NCR-${String(nextNum).padStart(4, '0')}`;
}

// --------------------------------------------------------------------------
// Service functions
// --------------------------------------------------------------------------

export async function createNcr(input: {
  projectId: string;
  actor: NcrActor;
  data: CreateNcrInput;
}): Promise<NcrResponse> {
  await assertProjectAccess(input.projectId, input.actor);

  for (let attempt = 0; attempt < 3; attempt++) {
    const number = await nextNcrNumber(input.projectId);
    try {
      const created = await prisma.ncr.create({
        data: {
          projectId: input.projectId,
          number,
          title: input.data.title,
          description: input.data.description,
          severity: input.data.severity ?? 'MINOR',
          discipline: input.data.discipline ?? null,
          rootCause: input.data.rootCause ?? null,
          documentId: input.data.documentId ?? null,
          rfiId: input.data.rfiId ?? null,
          vendorId: input.data.vendorId ?? null,
          raisedById: input.actor.id,
        },
      });

      try {
        await prisma.activity.create({
          data: {
            projectId: input.projectId,
            userId: input.actor.id,
            type: ActivityType.NCR_CREATED,
            title: `NCR ${created.number} raised`,
            description: created.title,
            metadata: { ncrId: created.id, severity: created.severity },
          },
        });
      } catch (err) {
        logger.warn('Failed to log NCR activity', { error: (err as Error).message });
      }

      logger.info('NCR created', { projectId: input.projectId, ncrId: created.id, number });
      return toNcrResponse(created);
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002' &&
        attempt < 2
      ) {
        logger.warn('NCR number collision, retrying', { projectId: input.projectId, number });
        continue;
      }
      throw err;
    }
  }

  throw new BadRequestError('Unable to allocate an NCR number, please retry');
}

export async function listNcrs(input: {
  projectId: string;
  actor: NcrActor;
  status?: NcrStatus;
  severity?: NcrSeverity;
  vendorId?: string;
  limit?: number;
  offset?: number;
}): Promise<{ ncrs: NcrResponse[]; total: number }> {
  await assertProjectAccess(input.projectId, input.actor);

  const where: Prisma.NcrWhereInput = {
    projectId: input.projectId,
    ...(input.status ? { status: input.status } : {}),
    ...(input.severity ? { severity: input.severity } : {}),
    ...(input.vendorId ? { vendorId: input.vendorId } : {}),
  };

  const [ncrs, total] = await prisma.$transaction([
    prisma.ncr.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }],
      take: input.limit ?? 200,
      skip: input.offset ?? 0,
    }),
    prisma.ncr.count({ where }),
  ]);

  return { total, ncrs: ncrs.map(toNcrResponse) };
}

export async function getNcr(input: {
  projectId: string;
  actor: NcrActor;
  ncrId: string;
}): Promise<NcrResponse> {
  await assertProjectAccess(input.projectId, input.actor);

  const ncr = await prisma.ncr.findFirst({
    where: { id: input.ncrId, projectId: input.projectId },
  });
  if (!ncr) throw new NotFoundError('NCR', input.ncrId);

  return toNcrResponse(ncr);
}

export async function updateNcr(input: {
  projectId: string;
  actor: NcrActor;
  ncrId: string;
  data: UpdateNcrInput;
}): Promise<NcrResponse> {
  await assertProjectAccess(input.projectId, input.actor);

  const existing = await prisma.ncr.findFirst({
    where: { id: input.ncrId, projectId: input.projectId },
  });
  if (!existing) throw new NotFoundError('NCR', input.ncrId);

  const now = new Date();
  const updateData: Prisma.NcrUncheckedUpdateInput = {};

  if (input.data.title !== undefined) updateData.title = input.data.title;
  if (input.data.description !== undefined) updateData.description = input.data.description;
  if (input.data.severity !== undefined) updateData.severity = input.data.severity;
  if (input.data.discipline !== undefined) updateData.discipline = input.data.discipline;
  if (input.data.rootCause !== undefined) updateData.rootCause = input.data.rootCause;
  if (input.data.resolutionNote !== undefined) updateData.resolutionNote = input.data.resolutionNote;
  if (input.data.documentId !== undefined) updateData.documentId = input.data.documentId;
  if (input.data.rfiId !== undefined) updateData.rfiId = input.data.rfiId;
  if (input.data.vendorId !== undefined) updateData.vendorId = input.data.vendorId;

  if (input.data.status !== undefined && input.data.status !== existing.status) {
    if (!canNcrTransition(existing.status, input.data.status)) {
      throw new BadRequestError(
        `Invalid NCR status transition: ${existing.status} → ${input.data.status}`
      );
    }
    if (input.data.status === NcrStatus.RESOLVED) {
      updateData.resolvedAt = now;
    }
    if (input.data.status === NcrStatus.CLOSED) {
      updateData.closedAt = now;
    }
    updateData.status = input.data.status;
  }

  const updated = await prisma.ncr.update({
    where: { id: input.ncrId },
    data: updateData,
  });

  logger.info('NCR updated', { projectId: input.projectId, ncrId: input.ncrId });
  return toNcrResponse(updated);
}

export async function getNcrAnalytics(input: {
  projectId: string;
  actor: NcrActor;
}): Promise<NcrAnalyticsResponse> {
  await assertProjectAccess(input.projectId, input.actor);

  const ncrs = await prisma.ncr.findMany({
    where: { projectId: input.projectId },
    select: { status: true, severity: true },
  });

  const byStatus: Record<NcrStatus, number> = {
    OPEN: 0,
    UNDER_REVIEW: 0,
    RESOLVED: 0,
    CLOSED: 0,
    VOID: 0,
  };
  const bySeverity: Record<NcrSeverity, number> = {
    MINOR: 0,
    MAJOR: 0,
    CRITICAL: 0,
  };

  for (const ncr of ncrs) {
    byStatus[ncr.status]++;
    bySeverity[ncr.severity]++;
  }

  return {
    total: ncrs.length,
    byStatus,
    bySeverity,
    open: byStatus.OPEN + byStatus.UNDER_REVIEW,
    resolved: byStatus.RESOLVED + byStatus.CLOSED,
  };
}
