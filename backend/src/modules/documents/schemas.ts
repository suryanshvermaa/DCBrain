import { DocumentStatus } from '@prisma/client';
import { z } from 'zod';

export const uploadDocumentsSchema = z.object({
  category: z.string().trim().min(1).max(80).optional(),
});

export const documentParamsSchema = z.object({
  id: z.string().min(1),
  documentId: z.string().min(1),
});

export const projectDocumentsParamsSchema = z.object({
  id: z.string().min(1),
});

export const listDocumentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(160).optional(),
  category: z.string().trim().max(80).optional(),
  status: z.nativeEnum(DocumentStatus).optional(),
  sortBy: z.enum(['uploadedAt', 'originalName', 'size', 'status', 'category']).default('uploadedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type UploadDocumentsPayload = z.infer<typeof uploadDocumentsSchema>;
export type ListDocumentsQuery = z.infer<typeof listDocumentsQuerySchema>;
