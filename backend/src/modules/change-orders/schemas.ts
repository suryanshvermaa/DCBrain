import { z } from 'zod';

export const CHANGE_ORDER_STATUSES = [
  'DRAFT',
  'PENDING_APPROVAL',
  'APPROVED',
  'REJECTED',
  'CANCELLED',
] as const;

export const coParamsSchema = z.object({
  id: z.string().min(1),
});

export const coIdParamsSchema = z.object({
  id: z.string().min(1),
  coId: z.string().min(1),
});

export const coListQuerySchema = z.object({
  status: z.enum(CHANGE_ORDER_STATUSES).optional(),
  limit: z.coerce.number().int().min(1).max(500).default(200),
  offset: z.coerce.number().int().min(0).default(0),
});

export const createCoSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().min(1).max(10_000),
  reason: z.string().max(2_000).nullable().optional(),
  costImpact: z.number().default(0),
  scheduleImpactDays: z.number().int().default(0),
  documentId: z.string().nullable().optional(),
  scheduleActivityId: z.string().nullable().optional(),
});

export const updateCoSchema = z
  .object({
    title: z.string().min(1).max(500).optional(),
    description: z.string().min(1).max(10_000).optional(),
    reason: z.string().max(2_000).nullable().optional(),
    costImpact: z.number().optional(),
    scheduleImpactDays: z.number().int().optional(),
    status: z.enum(CHANGE_ORDER_STATUSES).optional(),
    documentId: z.string().nullable().optional(),
    scheduleActivityId: z.string().nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export type CreateCoInput = z.infer<typeof createCoSchema>;
export type UpdateCoInput = z.infer<typeof updateCoSchema>;
