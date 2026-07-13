import { z } from 'zod';

export const complianceCheckSchema = z.object({
  documentIds: z.array(z.string().min(1)).optional(),
  standards: z.array(z.string().min(1)).optional(),
  notes: z.string().max(2000).optional(),
});

export const projectComplianceParamsSchema = z.object({
  id: z.string().min(1),
});
