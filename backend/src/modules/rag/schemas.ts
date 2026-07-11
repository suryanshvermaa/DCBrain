import { z } from 'zod';

export const searchFiltersSchema = z.object({
  category: z.string().trim().optional(),
  dateFrom: z.string().datetime({ offset: true }).optional(),
  dateTo: z.string().datetime({ offset: true }).optional(),
  documentIds: z.array(z.string().cuid()).optional(),
  topK: z.number().int().min(1).max(50).optional().default(10),
});

export const searchRequestSchema = z.object({
  query: z.string().trim().min(1, 'Query is required').max(2000, 'Query is too long'),
  filters: searchFiltersSchema.optional(),
});

export const searchHistoryQuerySchema = z.object({
  page: z
    .string()
    .transform((v) => parseInt(v, 10))
    .pipe(z.number().int().min(1))
    .optional()
    .default('1'),
  pageSize: z
    .string()
    .transform((v) => parseInt(v, 10))
    .pipe(z.number().int().min(1).max(50))
    .optional()
    .default('20'),
});

export type SearchRequest = z.infer<typeof searchRequestSchema>;
export type SearchFiltersInput = z.infer<typeof searchFiltersSchema>;
export type SearchHistoryQuery = z.infer<typeof searchHistoryQuerySchema>;
