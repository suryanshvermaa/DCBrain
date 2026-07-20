import { Router, type Request, type Response } from 'express';
import { Role } from '@prisma/client';
import { asyncHandler } from '@/core/middleware/errorHandler';
import { requireAuth, type AuthenticatedRequest } from '@/modules/auth/middleware';
import { requirePermission } from '@/modules/auth/middleware';
import { z } from 'zod';
import { searchRequestSchema, searchHistoryQuerySchema } from '@/modules/rag/schemas';
import { runRagPipeline, listSearchHistory, deleteSearchHistoryItem } from '@/modules/rag/pipeline';
import { assertProjectAccess } from '@/modules/projects';
import { logger } from '@/lib/logger';

export const searchRouter = Router({ mergeParams: true });

searchRouter.use(requireAuth);

function getActor(req: Request) {
  const user = (req as AuthenticatedRequest).auth?.user;
  return {
    id: user?.id ?? '',
    role: user?.role ?? Role.VIEWER,
  };
}

const projectParamsSchema = z.object({
  id: z.string().min(1),
});

/** POST /api/v1/projects/:id/search */
searchRouter.post(
  '/',
  requirePermission('search_documents'),
  asyncHandler(async (req: Request, res: Response) => {
    const { id: projectId } = projectParamsSchema.parse(req.params);
    const actor = getActor(req);
    await assertProjectAccess(projectId, actor);
    const body = searchRequestSchema.parse(req.body);

    logger.info('RAG search request', { projectId, userId: actor.id, query: body.query });

    const result = await runRagPipeline({
      projectId,
      userId: actor.id,
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
    const actor = getActor(req);
    await assertProjectAccess(projectId, actor);
    const query = searchHistoryQuerySchema.parse(req.query);

    const result = await listSearchHistory(projectId, actor.id, query.page, query.pageSize);

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

/** DELETE /api/v1/projects/:id/search/history/:hid */
searchRouter.delete(
  '/history/:hid',
  requirePermission('search_documents'),
  asyncHandler(async (req: Request, res: Response) => {
    const { id: projectId } = projectParamsSchema.parse(req.params);
    const hid = z.string().min(1).parse(req.params.hid);
    const actor = getActor(req);
    await assertProjectAccess(projectId, actor);

    await deleteSearchHistoryItem(hid, projectId, actor.id);
    res.status(200).json({ success: true });
  })
);

