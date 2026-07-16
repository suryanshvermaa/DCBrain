import { z } from 'zod';

export const INSPECTION_STATUSES = [
  'SCHEDULED',
  'IN_PROGRESS',
  'PASSED',
  'FAILED',
  'ON_HOLD',
  'WAIVED',
] as const;

export const inspectionParamsSchema = z.object({
  id: z.string().min(1),
});

export const inspectionIdParamsSchema = z.object({
  id: z.string().min(1),
  inspId: z.string().min(1),
});

export const inspectionListQuerySchema = z.object({
  status: z.enum(INSPECTION_STATUSES).optional(),
  discipline: z.string().optional(),
  holdPoint: z
    .string()
    .optional()
    .transform((v) => (v === 'true' ? true : v === 'false' ? false : undefined)),
  overdue: z
    .string()
    .optional()
    .transform((v) => (v === 'true' ? true : v === 'false' ? false : undefined)),
  limit: z.coerce.number().int().min(1).max(500).default(200),
  offset: z.coerce.number().int().min(0).default(0),
});

export const createInspectionSchema = z.object({
  title: z.string().min(1).max(500),
  itpRef: z.string().max(100).nullable().optional(),
  discipline: z.string().max(120).nullable().optional(),
  holdPoint: z.boolean().default(false),
  inspector: z.string().max(200).nullable().optional(),
  scheduledDate: z.coerce.date().nullable().optional(),
  vendorId: z.string().nullable().optional(),
  documentId: z.string().nullable().optional(),
});

export const updateInspectionSchema = z
  .object({
    title: z.string().min(1).max(500).optional(),
    itpRef: z.string().max(100).nullable().optional(),
    discipline: z.string().max(120).nullable().optional(),
    holdPoint: z.boolean().optional(),
    inspector: z.string().max(200).nullable().optional(),
    scheduledDate: z.coerce.date().nullable().optional(),
    completedDate: z.coerce.date().nullable().optional(),
    status: z.enum(INSPECTION_STATUSES).optional(),
    result: z.string().max(10_000).nullable().optional(),
    vendorId: z.string().nullable().optional(),
    documentId: z.string().nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export type CreateInspectionInput = z.infer<typeof createInspectionSchema>;
export type UpdateInspectionInput = z.infer<typeof updateInspectionSchema>;
