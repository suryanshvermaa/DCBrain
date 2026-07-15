import { z } from 'zod';

export const CreateSimulationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  targetActivityId: z.string().min(1, "Target activity ID is required"),
  delayDays: z.number().positive(),
  assumptions: z.record(z.any()).optional(),
});
