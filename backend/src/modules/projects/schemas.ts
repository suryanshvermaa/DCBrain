import { z } from 'zod';

export const projectIdParamSchema = z.object({
  id: z.string().min(1),
});

export const createProjectSchema = z.object({
  name: z.string().trim().min(2).max(160),
  description: z.string().trim().max(2000).optional(),
  code: z.string().trim().min(2).max(40),
  location: z.string().trim().max(160).optional(),
});

export type CreateProjectPayload = z.infer<typeof createProjectSchema>;
