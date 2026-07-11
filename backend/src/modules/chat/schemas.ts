import { z } from 'zod';

export const createSessionSchema = z.object({
  title: z.string().optional(),
});

export const sendMessageSchema = z.object({
  content: z.string().min(1, 'Message content is required'),
});

export const chatSessionQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
