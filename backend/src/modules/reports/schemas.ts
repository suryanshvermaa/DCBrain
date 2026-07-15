import { z } from 'zod';

export const reportParamsSchema = z.object({
  id: z.string().min(1, 'Project ID is required'),
});

export const reportDetailParamsSchema = z.object({
  id: z.string().min(1, 'Project ID is required'),
  reportId: z.string().min(1, 'Report ID is required'),
});

export const generateReportBodySchema = z.object({
  type: z.enum(['DAILY', 'WEEKLY', 'EXECUTIVE', 'COMPLIANCE', 'RISK', 'PROCUREMENT']),
  runAsync: z.boolean().default(false),
});

export const reportDownloadQuerySchema = z.object({
  format: z.enum(['pdf', 'md']).default('pdf'),
});

export const reportListQuerySchema = z.object({
  type: z.enum(['DAILY', 'WEEKLY', 'EXECUTIVE', 'COMPLIANCE', 'RISK', 'PROCUREMENT']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
