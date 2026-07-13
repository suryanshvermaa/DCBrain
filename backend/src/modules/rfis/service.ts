import { Prisma, RfiStatus, ActivityType, type Role, type RfiPriority } from '@prisma/client';
import { assertProjectAccess } from '@/modules/projects';
import { BadRequestError, NotFoundError } from '@/core/errors';
import { logger } from '@/lib/logger';
import prisma from '@/lib/prisma';
import { runRagPipeline } from '@/modules/rag/pipeline';
import type { CreateRfiInput, UpdateRfiInput } from './schemas';

// --------------------------------------------------------------------------
// Actor type (mirrors schedule / dashboard modules)
// --------------------------------------------------------------------------

export interface RfiActor {
  id: string;
  role: Role;
}

// --------------------------------------------------------------------------
// Status transition rules
// --------------------------------------------------------------------------

/** Terminal statuses that resolve an RFI (used for overdue / ageing logic). */
export const RESOLVED_STATUSES: RfiStatus[] = [
  RfiStatus.ANSWERED,
  RfiStatus.CLOSED,
  RfiStatus.VOID,
];

const ALLOWED_TRANSITIONS: Record<RfiStatus, RfiStatus[]> = {
  OPEN: [RfiStatus.IN_REVIEW, RfiStatus.ANSWERED, RfiStatus.VOID],
  IN_REVIEW: [RfiStatus.OPEN, RfiStatus.ANSWERED, RfiStatus.VOID],
  ANSWERED: [RfiStatus.IN_REVIEW, RfiStatus.CLOSED, RfiStatus.OPEN],
  CLOSED: [RfiStatus.IN_REVIEW],
  VOID: [],
};

/** Whether an RFI may move from one status to another. Same→same is a no-op. */
export function canTransition(from: RfiStatus, to: RfiStatus): boolean {
  if (from === to) return true;
  return ALLOWED_TRANSITIONS[from].includes(to);
}

// --------------------------------------------------------------------------
// Ageing / overdue helpers (pure, unit-tested)
// --------------------------------------------------------------------------

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Whole days between `from` and `now` (floored, never negative). */
export function ageInDays(from: Date, now: Date = new Date()): number {
  return Math.max(0, Math.floor((now.getTime() - from.getTime()) / MS_PER_DAY));
}

export type AgeingBucket = '0-7' | '8-14' | '15-30' | '30+';

export function ageingBucket(days: number): AgeingBucket {
  if (days <= 7) return '0-7';
  if (days <= 14) return '8-14';
  if (days <= 30) return '15-30';
  return '30+';
}

/** An RFI is overdue when it has a due date in the past and is still unresolved. */
export function isOverdue(
  rfi: { dueDate: Date | null; status: RfiStatus },
  now: Date = new Date()
): boolean {
  if (!rfi.dueDate) return false;
  if (RESOLVED_STATUSES.includes(rfi.status)) return false;
  return rfi.dueDate.getTime() < now.getTime();
}

// --------------------------------------------------------------------------
// Response DTOs
// --------------------------------------------------------------------------

export interface RfiDocumentLink {
  documentId: string;
  filename: string;
  originalName: string;
}

export interface RfiSource {
  documentId: string;
  documentName: string;
  excerpt: string;
  relevanceScore: number;
}

export interface RfiResponse {
  id: string;
  number: string;
  subject: string;
  question: string;
  status: RfiStatus;
  priority: RfiPriority;
  discipline: string | null;
  dueDate: string | null;
  resolution: string | null;
  suggestedAnswer: string | null;
  suggestedSources: RfiSource[];
  suggestedAt: string | null;
  answeredAt: string | null;
  closedAt: string | null;
  ageDays: number;
  overdue: boolean;
  raisedBy: { id: string; name: string } | null;
  assignee: { id: string; name: string } | null;
  answeredBy: { id: string; name: string } | null;
  documents: RfiDocumentLink[];
  createdAt: string;
  updatedAt: string;
}

export interface RfiAnalyticsResponse {
  total: number;
  byStatus: Record<RfiStatus, number>;
  open: number; // OPEN + IN_REVIEW (unresolved)
  overdue: number;
  avgResolutionDays: number | null;
  ageingBuckets: Record<AgeingBucket, number>;
}

// --------------------------------------------------------------------------
// Prisma include shape shared across reads
// --------------------------------------------------------------------------

const rfiInclude = {
  raisedBy: { select: { id: true, firstName: true, lastName: true } },
  assignee: { select: { id: true, firstName: true, lastName: true } },
  answeredBy: { select: { id: true, firstName: true, lastName: true } },
  documents: {
    include: {
      document: { select: { id: true, filename: true, originalName: true } },
    },
  },
} satisfies Prisma.RfiInclude;

type RfiWithRelations = Prisma.RfiGetPayload<{ include: typeof rfiInclude }>;

function fullName(
  user: { id: string; firstName: string; lastName: string } | null
): { id: string; name: string } | null {
  if (!user) return null;
  return { id: user.id, name: `${user.firstName} ${user.lastName}` };
}

function toRfiResponse(rfi: RfiWithRelations, now: Date = new Date()): RfiResponse {
  return {
    id: rfi.id,
    number: rfi.number,
    subject: rfi.subject,
    question: rfi.question,
    status: rfi.status,
    priority: rfi.priority,
    discipline: rfi.discipline,
    dueDate: rfi.dueDate?.toISOString() ?? null,
    resolution: rfi.resolution,
    suggestedAnswer: rfi.suggestedAnswer,
    suggestedSources: Array.isArray(rfi.suggestedSources)
      ? (rfi.suggestedSources as unknown as RfiSource[])
      : [],
    suggestedAt: rfi.suggestedAt?.toISOString() ?? null,
    answeredAt: rfi.answeredAt?.toISOString() ?? null,
    closedAt: rfi.closedAt?.toISOString() ?? null,
    ageDays: ageInDays(rfi.createdAt, now),
    overdue: isOverdue(rfi, now),
    raisedBy: fullName(rfi.raisedBy),
    assignee: fullName(rfi.assignee),
    answeredBy: fullName(rfi.answeredBy),
    documents: rfi.documents.map((link) => ({
      documentId: link.document.id,
      filename: link.document.filename,
      originalName: link.document.originalName,
    })),
    createdAt: rfi.createdAt.toISOString(),
    updatedAt: rfi.updatedAt.toISOString(),
  };
}

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

/** Generate the next project-scoped RFI number, e.g. "RFI-0001". */
async function nextRfiNumber(projectId: string): Promise<string> {
  const count = await prisma.rfi.count({ where: { projectId } });
  return `RFI-${String(count + 1).padStart(4, '0')}`;
}

/** Validate that the supplied document IDs all belong to the project. */
async function assertDocumentsInProject(projectId: string, documentIds: string[]): Promise<void> {
  if (documentIds.length === 0) return;
  const found = await prisma.document.count({
    where: { id: { in: documentIds }, projectId, deletedAt: null },
  });
  if (found !== new Set(documentIds).size) {
    throw new BadRequestError('One or more linked documents do not belong to this project');
  }
}

// --------------------------------------------------------------------------
// Service functions
// --------------------------------------------------------------------------

export async function createRfi(input: {
  projectId: string;
  actor: RfiActor;
  data: CreateRfiInput;
}): Promise<RfiResponse> {
  await assertProjectAccess(input.projectId, input.actor);

  const documentIds = input.data.documentIds ?? [];
  await assertDocumentsInProject(input.projectId, documentIds);

  // Retry once on a unique-number collision (concurrent create).
  for (let attempt = 0; attempt < 3; attempt++) {
    const number = await nextRfiNumber(input.projectId);
    try {
      const created = await prisma.rfi.create({
        data: {
          projectId: input.projectId,
          number,
          subject: input.data.subject,
          question: input.data.question,
          priority: input.data.priority,
          discipline: input.data.discipline ?? null,
          dueDate: input.data.dueDate ?? null,
          raisedById: input.actor.id,
          assigneeId: input.data.assigneeId ?? null,
          documents: {
            create: documentIds.map((documentId) => ({ documentId })),
          },
        },
        include: rfiInclude,
      });

      // Non-critical: surface the RFI in the project activity feed.
      try {
        await prisma.activity.create({
          data: {
            projectId: input.projectId,
            userId: input.actor.id,
            type: ActivityType.RFI_CREATED,
            title: `RFI ${created.number} raised`,
            description: created.subject,
            metadata: { rfiId: created.id },
          },
        });
      } catch (err) {
        logger.warn('Failed to log RFI activity', { error: (err as Error).message });
      }

      logger.info('RFI created', { projectId: input.projectId, rfiId: created.id, number });
      return toRfiResponse(created);
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002' &&
        attempt < 2
      ) {
        logger.warn('RFI number collision, retrying', { projectId: input.projectId, number });
        continue;
      }
      throw err;
    }
  }

  throw new BadRequestError('Unable to allocate an RFI number, please retry');
}

export async function listRfis(input: {
  projectId: string;
  actor: RfiActor;
  status?: RfiStatus;
  overdue?: boolean;
  assigneeId?: string;
  limit?: number;
  offset?: number;
}): Promise<{ rfis: RfiResponse[]; total: number }> {
  await assertProjectAccess(input.projectId, input.actor);

  const now = new Date();
  const where: Prisma.RfiWhereInput = {
    projectId: input.projectId,
    ...(input.status ? { status: input.status } : {}),
    ...(input.assigneeId ? { assigneeId: input.assigneeId } : {}),
    ...(input.overdue === true
      ? { dueDate: { lt: now }, status: { notIn: RESOLVED_STATUSES } }
      : {}),
    ...(input.overdue === false
      ? {
          OR: [{ dueDate: null }, { dueDate: { gte: now } }, { status: { in: RESOLVED_STATUSES } }],
        }
      : {}),
  };

  const [rfis, total] = await prisma.$transaction([
    prisma.rfi.findMany({
      where,
      include: rfiInclude,
      orderBy: [{ createdAt: 'desc' }],
      take: input.limit ?? 200,
      skip: input.offset ?? 0,
    }),
    prisma.rfi.count({ where }),
  ]);

  return { total, rfis: rfis.map((r) => toRfiResponse(r, now)) };
}

export async function getRfi(input: {
  projectId: string;
  actor: RfiActor;
  rfiId: string;
}): Promise<RfiResponse> {
  await assertProjectAccess(input.projectId, input.actor);

  const rfi = await prisma.rfi.findFirst({
    where: { id: input.rfiId, projectId: input.projectId },
    include: rfiInclude,
  });
  if (!rfi) throw new NotFoundError('RFI', input.rfiId);

  return toRfiResponse(rfi);
}

export async function updateRfi(input: {
  projectId: string;
  actor: RfiActor;
  rfiId: string;
  data: UpdateRfiInput;
}): Promise<RfiResponse> {
  await assertProjectAccess(input.projectId, input.actor);

  const existing = await prisma.rfi.findFirst({
    where: { id: input.rfiId, projectId: input.projectId },
  });
  if (!existing) throw new NotFoundError('RFI', input.rfiId);

  const now = new Date();
  const data: Prisma.RfiUpdateInput = {};

  if (input.data.subject !== undefined) data.subject = input.data.subject;
  if (input.data.question !== undefined) data.question = input.data.question;
  if (input.data.priority !== undefined) data.priority = input.data.priority;
  if (input.data.discipline !== undefined) data.discipline = input.data.discipline;
  if (input.data.dueDate !== undefined) data.dueDate = input.data.dueDate;
  if (input.data.resolution !== undefined) data.resolution = input.data.resolution;

  if (input.data.assigneeId !== undefined) {
    data.assignee = input.data.assigneeId
      ? { connect: { id: input.data.assigneeId } }
      : { disconnect: true };
  }

  // Status transition handling
  if (input.data.status !== undefined && input.data.status !== existing.status) {
    if (!canTransition(existing.status, input.data.status)) {
      throw new BadRequestError(
        `Invalid RFI status transition: ${existing.status} → ${input.data.status}`
      );
    }

    if (input.data.status === RfiStatus.ANSWERED) {
      const resolution = input.data.resolution ?? existing.resolution;
      if (!resolution || resolution.trim().length === 0) {
        throw new BadRequestError('A resolution is required before an RFI can be marked ANSWERED');
      }
      data.answeredBy = { connect: { id: input.actor.id } };
      data.answeredAt = now;
    }

    if (input.data.status === RfiStatus.CLOSED) {
      data.closedAt = now;
    }

    data.status = input.data.status;
  }

  // Re-sync linked documents when documentIds provided (full replace)
  if (input.data.documentIds !== undefined) {
    await assertDocumentsInProject(input.projectId, input.data.documentIds);
    data.documents = {
      deleteMany: {},
      create: input.data.documentIds.map((documentId) => ({ documentId })),
    };
  }

  const updated = await prisma.rfi.update({
    where: { id: input.rfiId },
    data,
    include: rfiInclude,
  });

  logger.info('RFI updated', { projectId: input.projectId, rfiId: input.rfiId });
  return toRfiResponse(updated);
}

/**
 * Generate an AI-suggested answer for an RFI using the project RAG pipeline.
 * The suggestion is stored as a draft; it does NOT become the official
 * resolution until a human approves it via updateRfi.
 */
export async function suggestRfiAnswer(input: {
  projectId: string;
  actor: RfiActor;
  rfiId: string;
}): Promise<RfiResponse> {
  await assertProjectAccess(input.projectId, input.actor);

  const rfi = await prisma.rfi.findFirst({
    where: { id: input.rfiId, projectId: input.projectId },
    include: { documents: true },
  });
  if (!rfi) throw new NotFoundError('RFI', input.rfiId);

  // Scope retrieval to linked documents when the RFI references specific ones.
  const linkedDocumentIds = rfi.documents.map((d) => d.documentId);
  const query = rfi.subject ? `${rfi.subject}\n\n${rfi.question}` : rfi.question;

  const rag = await runRagPipeline({
    projectId: input.projectId,
    userId: input.actor.id,
    query,
    filters: linkedDocumentIds.length > 0 ? { documentIds: linkedDocumentIds } : undefined,
  });

  const sources: RfiSource[] = rag.sources.map((s) => ({
    documentId: s.documentId,
    documentName: s.documentName,
    excerpt: s.excerpt,
    relevanceScore: s.relevanceScore,
  }));

  const updated = await prisma.rfi.update({
    where: { id: rfi.id },
    data: {
      suggestedAnswer: rag.answer,
      suggestedSources: sources as unknown as Prisma.InputJsonValue,
      suggestedAt: new Date(),
      // Move an untouched OPEN RFI into review once a draft exists.
      ...(rfi.status === RfiStatus.OPEN ? { status: RfiStatus.IN_REVIEW } : {}),
    },
    include: rfiInclude,
  });

  logger.info('RFI answer suggested', {
    projectId: input.projectId,
    rfiId: rfi.id,
    confidence: rag.confidence,
    sourceCount: sources.length,
  });

  return toRfiResponse(updated);
}

export async function getRfiAnalytics(input: {
  projectId: string;
  actor: RfiActor;
}): Promise<RfiAnalyticsResponse> {
  await assertProjectAccess(input.projectId, input.actor);

  const now = new Date();
  const rfis = await prisma.rfi.findMany({
    where: { projectId: input.projectId },
    select: {
      status: true,
      dueDate: true,
      createdAt: true,
      answeredAt: true,
    },
  });

  const byStatus: Record<RfiStatus, number> = {
    OPEN: 0,
    IN_REVIEW: 0,
    ANSWERED: 0,
    CLOSED: 0,
    VOID: 0,
  };
  const ageingBuckets: Record<AgeingBucket, number> = { '0-7': 0, '8-14': 0, '15-30': 0, '30+': 0 };

  let overdue = 0;
  let resolutionDaysSum = 0;
  let resolutionCount = 0;

  for (const rfi of rfis) {
    byStatus[rfi.status]++;

    if (isOverdue(rfi, now)) overdue++;

    const unresolved = !RESOLVED_STATUSES.includes(rfi.status);
    if (unresolved) {
      ageingBuckets[ageingBucket(ageInDays(rfi.createdAt, now))]++;
    }

    if (rfi.answeredAt) {
      resolutionDaysSum += ageInDays(rfi.createdAt, rfi.answeredAt);
      resolutionCount++;
    }
  }

  return {
    total: rfis.length,
    byStatus,
    open: byStatus.OPEN + byStatus.IN_REVIEW,
    overdue,
    avgResolutionDays:
      resolutionCount > 0 ? Math.round((resolutionDaysSum / resolutionCount) * 10) / 10 : null,
    ageingBuckets,
  };
}
