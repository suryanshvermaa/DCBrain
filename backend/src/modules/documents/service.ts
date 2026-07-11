import crypto from 'crypto';
import path from 'path';
import { DocumentStatus, Prisma, Role } from '@prisma/client';
import config from '@/core/config';
import { AppError, ForbiddenError, NotFoundError, ValidationError } from '@/core/errors';
import { createAuditLog } from '@/modules/auth/repository';
import { assertProjectAccess } from '@/modules/projects';
import { ensureBucketExists, getPresignedDownloadUrl, uploadBuffer } from '@/lib/minio';
import { createDocument, findDocument, listDocuments, softDeleteDocument, type DocumentRecord } from './repository';
import { enqueueDocumentProcessing } from './processing/queue';
import type { ListDocumentsQuery } from './schemas';

const MAX_FILES_PER_BATCH = 50;
const DEFAULT_DOWNLOAD_EXPIRY_SECONDS = 15 * 60;

interface AuthenticatedActor {
  id: string;
  role: Role;
}

export interface DocumentResponse {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  category: string;
  status: DocumentStatus;
  metadata: Prisma.JsonValue;
  uploadedAt: string;
  processedAt: string | null;
  completedAt: string | null;
  owner: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  versions: Array<{
    id: string;
    version: number;
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    createdAt: string;
  }>;
}

export interface UploadResult {
  documents: DocumentResponse[];
}

function sanitizeFilename(filename: string): string {
  const basename = path.basename(filename).trim();
  const sanitized = basename.replace(/[^a-zA-Z0-9._ -]/g, '_').replace(/\s+/g, ' ');
  return sanitized.length > 0 ? sanitized.slice(0, 180) : 'document';
}

function getExtension(filename: string): string {
  return path.extname(filename).toLowerCase();
}

function startsWithBytes(buffer: Buffer, signature: number[]): boolean {
  return signature.every((byte, index) => buffer[index] === byte);
}

function looksLikeText(buffer: Buffer): boolean {
  const sample = buffer.subarray(0, Math.min(buffer.length, 4096));
  if (sample.includes(0)) {
    return false;
  }

  const text = sample.toString('utf8');
  return !text.includes('\uFFFD');
}

function detectMimeType(buffer: Buffer, originalName: string): string | null {
  const extension = getExtension(originalName);

  if (startsWithBytes(buffer, [0x25, 0x50, 0x44, 0x46])) {
    return extension === '.pdf' ? 'application/pdf' : null;
  }

  if (startsWithBytes(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return extension === '.png' ? 'image/png' : null;
  }

  if (startsWithBytes(buffer, [0xff, 0xd8, 0xff])) {
    return extension === '.jpg' || extension === '.jpeg' ? 'image/jpeg' : null;
  }

  const isTiff =
    startsWithBytes(buffer, [0x49, 0x49, 0x2a, 0x00]) ||
    startsWithBytes(buffer, [0x4d, 0x4d, 0x00, 0x2a]);
  if (isTiff) {
    return extension === '.tif' || extension === '.tiff' ? 'image/tiff' : null;
  }

  if (startsWithBytes(buffer, [0x50, 0x4b, 0x03, 0x04])) {
    if (extension === '.docx') return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    if (extension === '.xlsx') return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    return null;
  }

  if (!looksLikeText(buffer)) {
    return null;
  }

  const text = buffer.subarray(0, Math.min(buffer.length, 1024 * 1024)).toString('utf8').trimStart();
  if (extension === '.json') {
    try {
      JSON.parse(text);
      return 'application/json';
    } catch {
      return null;
    }
  }

  if (extension === '.xml' && text.startsWith('<')) {
    return 'application/xml';
  }

  if (extension === '.csv') {
    return 'text/csv';
  }

  if (extension === '.txt' || extension === '.md') {
    return 'text/plain';
  }

  return null;
}

function assertUploadFiles(files: Express.Multer.File[]): void {
  if (files.length === 0) {
    throw new ValidationError('At least one file is required', { files: ['Upload one or more files'] });
  }

  if (files.length > MAX_FILES_PER_BATCH) {
    throw new AppError(`A maximum of ${MAX_FILES_PER_BATCH} files can be uploaded at once`, 413, 'UPLOAD_BATCH_TOO_LARGE');
  }

  const maxSizeBytes = config.MAX_UPLOAD_SIZE_MB * 1024 * 1024;
  files.forEach((file) => {
    if (file.size > maxSizeBytes) {
      throw new AppError(`File ${file.originalname} exceeds the ${config.MAX_UPLOAD_SIZE_MB}MB limit`, 413, 'FILE_TOO_LARGE');
    }
  });
}

function toDocumentResponse(document: DocumentRecord): DocumentResponse {
  return {
    id: document.id,
    filename: document.filename,
    originalName: document.originalName,
    mimeType: document.mimeType,
    size: document.size,
    category: document.category,
    status: document.status,
    metadata: document.metadata,
    uploadedAt: document.uploadedAt.toISOString(),
    processedAt: document.processedAt ? document.processedAt.toISOString() : null,
    completedAt: document.completedAt ? document.completedAt.toISOString() : null,
    owner: document.owner,
    versions: document.versions.map((version) => ({
      id: version.id,
      version: version.version,
      filename: version.filename,
      originalName: version.originalName,
      mimeType: version.mimeType,
      size: version.size,
      createdAt: version.createdAt.toISOString(),
    })),
  };
}

export async function uploadDocuments(input: {
  projectId: string;
  actor: AuthenticatedActor;
  files: Express.Multer.File[];
  category?: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}): Promise<UploadResult> {
  await assertProjectAccess(input.projectId, input.actor);
  assertUploadFiles(input.files);
  await ensureBucketExists();

  const category = input.category?.trim() || 'uncategorized';
  const validatedFiles = input.files.map((file) => {
    const detectedMimeType = detectMimeType(file.buffer, file.originalname);
    if (!detectedMimeType) {
      throw new ValidationError('Unsupported or invalid file type', {
        [file.originalname]: ['File content does not match a supported document type'],
      });
    }

    return {
      file,
      detectedMimeType,
      filename: sanitizeFilename(file.originalname),
    };
  });
  const documents: DocumentResponse[] = [];

  for (const { file, detectedMimeType, filename } of validatedFiles) {
    const objectKey = `projects/${input.projectId}/documents/${crypto.randomUUID()}/${filename}`;

    await uploadBuffer(objectKey, file.buffer, {
      'Content-Type': detectedMimeType,
      'Original-Name': filename,
    });

    const document = await createDocument({
      filename,
      originalName: file.originalname,
      mimeType: detectedMimeType,
      size: file.size,
      category,
      path: objectKey,
      bucket: config.MINIO_BUCKET_NAME,
      metadata: {
        detectedMimeType,
        uploadedMimeType: file.mimetype,
        extension: getExtension(file.originalname),
      },
      projectId: input.projectId,
      ownerId: input.actor.id,
    });

    await enqueueDocumentProcessing({
      documentId: document.id,
      projectId: input.projectId,
      filename: document.filename,
      mimeType: document.mimeType,
      bucket: document.bucket,
      path: document.path,
      ownerId: input.actor.id,
    });

    await createAuditLog({
      userId: input.actor.id,
      action: 'document.upload',
      resourceType: 'document',
      resourceId: document.id,
      details: {
        projectId: input.projectId,
        fileName: document.originalName,
        fileSize: document.size,
        category: document.category,
      },
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    });

    documents.push(toDocumentResponse(document));
  }

  return { documents };
}

export async function listProjectDocuments(input: {
  projectId: string;
  actor: AuthenticatedActor;
  query: ListDocumentsQuery;
}): Promise<{
  documents: DocumentResponse[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}> {
  await assertProjectAccess(input.projectId, input.actor);
  const result = await listDocuments({
    projectId: input.projectId,
    ...input.query,
  });

  return {
    documents: result.documents.map(toDocumentResponse),
    pagination: {
      page: input.query.page,
      pageSize: input.query.pageSize,
      total: result.total,
      totalPages: Math.ceil(result.total / input.query.pageSize),
    },
  };
}

export async function getProjectDocument(input: {
  projectId: string;
  documentId: string;
  actor: AuthenticatedActor;
}): Promise<DocumentResponse> {
  await assertProjectAccess(input.projectId, input.actor);
  const document = await findDocument(input.projectId, input.documentId);
  if (!document) {
    throw new NotFoundError('Document', input.documentId);
  }

  return toDocumentResponse(document);
}

export async function getDocumentDownloadUrl(input: {
  projectId: string;
  documentId: string;
  actor: AuthenticatedActor;
}): Promise<{ url: string; expiresInSeconds: number }> {
  await assertProjectAccess(input.projectId, input.actor);
  const document = await findDocument(input.projectId, input.documentId);
  if (!document) {
    throw new NotFoundError('Document', input.documentId);
  }

  await createAuditLog({
    userId: input.actor.id,
    action: 'document.download_url',
    resourceType: 'document',
    resourceId: document.id,
    details: {
      projectId: input.projectId,
    },
  });

  return {
    url: await getPresignedDownloadUrl(document.path, DEFAULT_DOWNLOAD_EXPIRY_SECONDS),
    expiresInSeconds: DEFAULT_DOWNLOAD_EXPIRY_SECONDS,
  };
}

export async function getDocumentProcessingStatus(input: {
  projectId: string;
  documentId: string;
  actor: AuthenticatedActor;
}): Promise<{ status: DocumentStatus; progress: number; step: string | null }> {
  await assertProjectAccess(input.projectId, input.actor);
  const document = await findDocument(input.projectId, input.documentId);
  if (!document) {
    throw new NotFoundError('Document', input.documentId);
  }

  const metadata = (document.metadata as Record<string, unknown> | null) ?? {};
  const processing = metadata['processing'] as { step?: string } | undefined;

  return {
    status: document.status,
    progress: document.status === DocumentStatus.PROCESSED ? 100 : document.status === DocumentStatus.FAILED ? 0 : 50,
    step: processing?.step ?? null,
  };
}

export async function deleteProjectDocument(input: {
  projectId: string;
  documentId: string;
  actor: AuthenticatedActor;
  ipAddress?: string | null;
  userAgent?: string | null;
}): Promise<void> {
  await assertProjectAccess(input.projectId, input.actor);
  const document = await findDocument(input.projectId, input.documentId);
  if (!document) {
    throw new NotFoundError('Document', input.documentId);
  }

  if (input.actor.role === Role.ENGINEER && document.owner.id !== input.actor.id) {
    throw new ForbiddenError('Engineers can delete only documents they uploaded');
  }

  await softDeleteDocument(document.id);
  await createAuditLog({
    userId: input.actor.id,
    action: 'document.delete',
    resourceType: 'document',
    resourceId: document.id,
    details: {
      projectId: input.projectId,
      fileName: document.originalName,
    },
    ipAddress: input.ipAddress,
    userAgent: input.userAgent,
  });
}
