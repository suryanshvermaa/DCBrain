import { z } from 'zod';

export const COMMISSIONING_STATUSES = [
  'NOT_STARTED',
  'IN_PROGRESS',
  'PASSED',
  'FAILED',
  'CLOSED',
] as const;

export const cxParamsSchema = z.object({
  id: z.string().min(1),
});

export const cxIdParamsSchema = z.object({
  id: z.string().min(1),
  cxId: z.string().min(1),
});

export const cxListQuerySchema = z.object({
  status: z.enum(COMMISSIONING_STATUSES).optional(),
  discipline: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(500).default(200),
  offset: z.coerce.number().int().min(0).default(0),
});

export const createCxSchema = z.object({
  systemName: z.string().min(1).max(300),
  testRef: z.string().max(100).nullable().optional(),
  discipline: z.string().max(120).nullable().optional(),
  procedure: z.string().max(500).nullable().optional(),
  testedBy: z.string().max(200).nullable().optional(),
  documentId: z.string().nullable().optional(),
});

export const updateCxSchema = z
  .object({
    systemName: z.string().min(1).max(300).optional(),
    testRef: z.string().max(100).nullable().optional(),
    discipline: z.string().max(120).nullable().optional(),
    status: z.enum(COMMISSIONING_STATUSES).optional(),
    procedure: z.string().max(500).nullable().optional(),
    result: z.string().max(10_000).nullable().optional(),
    testedBy: z.string().max(200).nullable().optional(),
    completedDate: z.coerce.date().nullable().optional(),
    documentId: z.string().nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export type CreateCxInput = z.infer<typeof createCxSchema>;
export type UpdateCxInput = z.infer<typeof updateCxSchema>;
