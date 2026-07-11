import { Router, type Request, type Response } from 'express';
import { asyncHandler } from '@/core/middleware/errorHandler';
import { requireAuth, type AuthenticatedRequest } from '@/modules/auth/middleware';
import { requirePermission } from '@/modules/auth/middleware';
import { z } from 'zod';
import { searchRequestSchema, searchHistoryQuerySchema } from '@/modules/rag/schemas';
import { runRagPipeline, listSearchHistory } from '@/modules/rag/pipeline';
import { logger } from '@/lib/logger';

export const searchRouter = Router({ mergeParams: true });

searchRouter.use(requireAuth);

const projectParamsSchema = z.object({
  id: z.string().min(1),
});

/** POST /api/v1/projects/:id/search */
searchRouter.post(
  '/',
  requirePermission('search_documents'),
  asyncHandler(async (req: Request, res: Response) => {
    const { id: projectId } = projectParamsSchema.parse(req.params);
    const userId = (req as AuthenticatedRequest).auth?.user?.id ?? '';
    const body = searchRequestSchema.parse(req.body);

    logger.info('RAG search request', { projectId, userId, query: body.query });

    const result = await runRagPipeline({
      projectId,
      userId,
      query: body.query,
      filters: body.filters,
    });

    res.status(200).json(result);
  })
);

/** GET /api/v1/projects/:id/search/history */
searchRouter.get(
  '/history',
  requirePermission('search_documents'),
  asyncHandler(async (req: Request, res: Response) => {
    const { id: projectId } = projectParamsSchema.parse(req.params);
    const userId = (req as AuthenticatedRequest).auth?.user?.id ?? '';
    const query = searchHistoryQuerySchema.parse(req.query);

    const result = await listSearchHistory(projectId, userId, query.page, query.pageSize);

    res.status(200).json({
      history: result.history,
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total: result.total,
        totalPages: Math.ceil(result.total / query.pageSize),
      },
    });
  })
);
