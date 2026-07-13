import { z } from 'zod';

export const RFI_STATUSES = ['OPEN', 'IN_REVIEW', 'ANSWERED', 'CLOSED', 'VOID'] as const;
export const RFI_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;

export const rfiParamsSchema = z.object({
  id: z.string().min(1),
});

export const rfiIdParamsSchema = z.object({
  id: z.string().min(1),
  rfiId: z.string().min(1),
});

export const rfiListQuerySchema = z.object({
  status: z.enum(RFI_STATUSES).optional(),
  overdue: z
    .string()
    .optional()
    .transform((v) => (v === 'true' ? true : v === 'false' ? false : undefined)),
  assigneeId: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(500).default(200),
  offset: z.coerce.number().int().min(0).default(0),
});

export const createRfiSchema = z.object({
  subject: z.string().min(1).max(500),
  question: z.string().min(1).max(10_000),
  priority: z.enum(RFI_PRIORITIES).default('MEDIUM'),
  discipline: z.string().max(120).nullable().optional(),
  dueDate: z.coerce.date().nullable().optional(),
  assigneeId: z.string().nullable().optional(),
  documentIds: z.array(z.string()).max(50).optional(),
});

export const updateRfiSchema = z
  .object({
    subject: z.string().min(1).max(500).optional(),
    question: z.string().min(1).max(10_000).optional(),
    status: z.enum(RFI_STATUSES).optional(),
    priority: z.enum(RFI_PRIORITIES).optional(),
    discipline: z.string().max(120).nullable().optional(),
    dueDate: z.coerce.date().nullable().optional(),
    assigneeId: z.string().nullable().optional(),
    resolution: z.string().max(20_000).nullable().optional(),
    documentIds: z.array(z.string()).max(50).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export type CreateRfiInput = z.infer<typeof createRfiSchema>;
export type UpdateRfiInput = z.infer<typeof updateRfiSchema>;
