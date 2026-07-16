import { z } from 'zod';

export const NCR_STATUSES = ['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'CLOSED', 'VOID'] as const;
export const NCR_SEVERITIES = ['MINOR', 'MAJOR', 'CRITICAL'] as const;

export const ncrParamsSchema = z.object({
  id: z.string().min(1),
});

export const ncrIdParamsSchema = z.object({
  id: z.string().min(1),
  ncrId: z.string().min(1),
});

export const ncrListQuerySchema = z.object({
  status: z.enum(NCR_STATUSES).optional(),
  severity: z.enum(NCR_SEVERITIES).optional(),
  vendorId: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(500).default(200),
  offset: z.coerce.number().int().min(0).default(0),
});

export const createNcrSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().min(1).max(10_000),
  severity: z.enum(NCR_SEVERITIES).default('MINOR'),
  discipline: z.string().max(120).nullable().optional(),
  rootCause: z.string().max(5_000).nullable().optional(),
  documentId: z.string().nullable().optional(),
  rfiId: z.string().nullable().optional(),
  vendorId: z.string().nullable().optional(),
});

export const updateNcrSchema = z
  .object({
    title: z.string().min(1).max(500).optional(),
    description: z.string().min(1).max(10_000).optional(),
    severity: z.enum(NCR_SEVERITIES).optional(),
    status: z.enum(NCR_STATUSES).optional(),
    discipline: z.string().max(120).nullable().optional(),
    rootCause: z.string().max(5_000).nullable().optional(),
    resolutionNote: z.string().max(10_000).nullable().optional(),
    documentId: z.string().nullable().optional(),
    rfiId: z.string().nullable().optional(),
    vendorId: z.string().nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export type CreateNcrInput = z.infer<typeof createNcrSchema>;
export type UpdateNcrInput = z.infer<typeof updateNcrSchema>;
