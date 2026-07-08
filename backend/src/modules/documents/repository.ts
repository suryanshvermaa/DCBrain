import { DocumentStatus, Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';

const documentInclude = {
  owner: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
    },
  },
  versions: {
    orderBy: {
      version: 'desc',
    },
    select: {
      id: true,
      version: true,
      filename: true,
      originalName: true,
      mimeType: true,
      size: true,
      createdAt: true,
    },
  },
} satisfies Prisma.DocumentInclude;

export type DocumentRecord = Prisma.DocumentGetPayload<{
  include: typeof documentInclude;
}>;

export interface CreateDocumentInput {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  category: string;
  path: string;
  bucket: string;
  metadata: Prisma.InputJsonValue;
  projectId: string;
  ownerId: string;
}

export interface ListDocumentsInput {
  projectId: string;
  page: number;
  pageSize: number;
  search?: string;
  category?: string;
  status?: DocumentStatus;
  sortBy: 'uploadedAt' | 'originalName' | 'size' | 'status' | 'category';
  sortOrder: 'asc' | 'desc';
}

export async function createDocument(input: CreateDocumentInput): Promise<DocumentRecord> {
  return prisma.document.create({
    data: {
      filename: input.filename,
      originalName: input.originalName,
      mimeType: input.mimeType,
      size: input.size,
      category: input.category,
      path: input.path,
      bucket: input.bucket,
      status: DocumentStatus.QUEUED,
      metadata: input.metadata,
      projectId: input.projectId,
      ownerId: input.ownerId,
      versions: {
        create: {
          version: 1,
          filename: input.filename,
          originalName: input.originalName,
          mimeType: input.mimeType,
          size: input.size,
          path: input.path,
          bucket: input.bucket,
          metadata: input.metadata,
          uploadedById: input.ownerId,
        },
      },
    },
    include: documentInclude,
  });
}

export async function listDocuments(input: ListDocumentsInput): Promise<{
  documents: DocumentRecord[];
  total: number;
}> {
  const where: Prisma.DocumentWhereInput = {
    projectId: input.projectId,
    deletedAt: null,
    ...(input.category ? { category: input.category } : {}),
    ...(input.status ? { status: input.status } : {}),
    ...(input.search
      ? {
          OR: [
            { originalName: { contains: input.search, mode: 'insensitive' } },
            { filename: { contains: input.search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [documents, total] = await prisma.$transaction([
    prisma.document.findMany({
      where,
      include: documentInclude,
      orderBy: {
        [input.sortBy]: input.sortOrder,
      },
      skip: (input.page - 1) * input.pageSize,
      take: input.pageSize,
    }),
    prisma.document.count({ where }),
  ]);

  return { documents, total };
}

export async function findDocument(projectId: string, documentId: string): Promise<DocumentRecord | null> {
  return prisma.document.findFirst({
    where: {
      id: documentId,
      projectId,
      deletedAt: null,
    },
    include: documentInclude,
  });
}

export async function softDeleteDocument(documentId: string): Promise<void> {
  await prisma.document.update({
    where: { id: documentId },
    data: {
      deletedAt: new Date(),
      status: DocumentStatus.ARCHIVED,
    },
  });
}
