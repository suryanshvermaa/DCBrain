import { z } from 'zod';

export const dashboardParamsSchema = z.object({
  id: z.string().min(1, 'Project ID is required'),
});

export const dashboardQuerySchema = z.object({
  refresh: z
    .string()
    .optional()
    .transform((v) => v === 'true'),
});
