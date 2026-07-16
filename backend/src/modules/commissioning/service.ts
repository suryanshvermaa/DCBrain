import { Prisma, CommissioningStatus, type Role, type CommissioningRecord } from '@prisma/client';
import { assertProjectAccess } from '@/modules/projects';
import { NotFoundError } from '@/core/errors';
import { logger } from '@/lib/logger';
import prisma from '@/lib/prisma';
import type { CreateCxInput, UpdateCxInput } from './schemas';

export interface CxActor {
  id: string;
  role: Role;
}

export interface CxResponse {
  id: string;
  testRef: string | null;
  systemName: string;
  discipline: string | null;
  status: CommissioningStatus;
  procedure: string | null;
  result: string | null;
  testedBy: string | null;
  completedDate: string | null;
  documentId: string | null;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CxSummaryResponse {
  total: number;
  byStatus: Record<CommissioningStatus, number>;
  passRate: number;
  pendingCount: number;
  byDiscipline: Record<string, number>;
}

function toCxResponse(cx: CommissioningRecord): CxResponse {
  return {
    id: cx.id,
    testRef: cx.testRef,
    systemName: cx.systemName,
    discipline: cx.discipline,
    status: cx.status,
    procedure: cx.procedure,
    result: cx.result,
    testedBy: cx.testedBy,
    completedDate: cx.completedDate?.toISOString() ?? null,
    documentId: cx.documentId,
    projectId: cx.projectId,
    createdAt: cx.createdAt.toISOString(),
    updatedAt: cx.updatedAt.toISOString(),
  };
}

export async function createCommissioning(input: {
  projectId: string;
  actor: CxActor;
  data: CreateCxInput;
}): Promise<CxResponse> {
  await assertProjectAccess(input.projectId, input.actor);

  const created = await prisma.commissioningRecord.create({
    data: {
      projectId: input.projectId,
      systemName: input.data.systemName,
      testRef: input.data.testRef ?? null,
      discipline: input.data.discipline ?? null,
      procedure: input.data.procedure ?? null,
      testedBy: input.data.testedBy ?? null,
      documentId: input.data.documentId ?? null,
    },
  });

  logger.info('Commissioning record created', {
    projectId: input.projectId,
    cxId: created.id,
  });
  return toCxResponse(created);
}

export async function listCommissioning(input: {
  projectId: string;
  actor: CxActor;
  status?: CommissioningStatus;
  discipline?: string;
  limit?: number;
  offset?: number;
}): Promise<{ records: CxResponse[]; total: number }> {
  await assertProjectAccess(input.projectId, input.actor);

  const where: Prisma.CommissioningRecordWhereInput = {
    projectId: input.projectId,
    ...(input.status ? { status: input.status } : {}),
    ...(input.discipline ? { discipline: input.discipline } : {}),
  };

  const [records, total] = await prisma.$transaction([
    prisma.commissioningRecord.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }],
      take: input.limit ?? 200,
      skip: input.offset ?? 0,
    }),
    prisma.commissioningRecord.count({ where }),
  ]);

  return { total, records: records.map(toCxResponse) };
}

export async function getCommissioning(input: {
  projectId: string;
  actor: CxActor;
  cxId: string;
}): Promise<CxResponse> {
  await assertProjectAccess(input.projectId, input.actor);

  const cx = await prisma.commissioningRecord.findFirst({
    where: { id: input.cxId, projectId: input.projectId },
  });
  if (!cx) throw new NotFoundError('Commissioning record', input.cxId);

  return toCxResponse(cx);
}

export async function updateCommissioning(input: {
  projectId: string;
  actor: CxActor;
  cxId: string;
  data: UpdateCxInput;
}): Promise<CxResponse> {
  await assertProjectAccess(input.projectId, input.actor);

  const existing = await prisma.commissioningRecord.findFirst({
    where: { id: input.cxId, projectId: input.projectId },
  });
  if (!existing) throw new NotFoundError('Commissioning record', input.cxId);

  const updateData: Prisma.CommissioningRecordUpdateInput = {};
  if (input.data.systemName !== undefined) updateData.systemName = input.data.systemName;
  if (input.data.testRef !== undefined) updateData.testRef = input.data.testRef;
  if (input.data.discipline !== undefined) updateData.discipline = input.data.discipline;
  if (input.data.status !== undefined) updateData.status = input.data.status;
  if (input.data.procedure !== undefined) updateData.procedure = input.data.procedure;
  if (input.data.result !== undefined) updateData.result = input.data.result;
  if (input.data.testedBy !== undefined) updateData.testedBy = input.data.testedBy;
  if (input.data.completedDate !== undefined) updateData.completedDate = input.data.completedDate;
  if (input.data.documentId !== undefined) updateData.documentId = input.data.documentId;

  const updated = await prisma.commissioningRecord.update({
    where: { id: input.cxId },
    data: updateData,
  });

  logger.info('Commissioning record updated', { projectId: input.projectId, cxId: input.cxId });
  return toCxResponse(updated);
}

export async function getCommissioningSummary(input: {
  projectId: string;
  actor: CxActor;
}): Promise<CxSummaryResponse> {
  await assertProjectAccess(input.projectId, input.actor);

  const records = await prisma.commissioningRecord.findMany({
    where: { projectId: input.projectId },
    select: { status: true, discipline: true },
  });

  const byStatus: Record<CommissioningStatus, number> = {
    NOT_STARTED: 0,
    IN_PROGRESS: 0,
    PASSED: 0,
    FAILED: 0,
    CLOSED: 0,
  };
  const byDiscipline: Record<string, number> = {};

  for (const cx of records) {
    byStatus[cx.status]++;
    const disc = cx.discipline ?? 'Unknown';
    byDiscipline[disc] = (byDiscipline[disc] ?? 0) + 1;
  }

  const completed = byStatus.PASSED + byStatus.FAILED + byStatus.CLOSED;
  const passRate =
    completed > 0
      ? Math.round(((byStatus.PASSED + byStatus.CLOSED) / completed) * 100)
      : 0;

  return {
    total: records.length,
    byStatus,
    passRate,
    pendingCount: byStatus.NOT_STARTED + byStatus.IN_PROGRESS,
    byDiscipline,
  };
}
