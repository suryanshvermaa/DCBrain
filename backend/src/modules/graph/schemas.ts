import { z } from 'zod';

export const GraphQuerySchema = z.object({
  depth: z.string().optional().transform(val => (val ? parseInt(val, 10) : 3)),
  types: z.string().optional().describe("Comma-separated list of labels to include (e.g. Equipment,Vendor)"),
});
