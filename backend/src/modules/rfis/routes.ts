import { Router, type Request, type Response } from 'express';
import { Role } from '@prisma/client';
import { asyncHandler } from '@/core/middleware/errorHandler';
import {
  requireAuth,
  requirePermission,
  type AuthenticatedRequest,
} from '@/modules/auth/middleware';
import {
  rfiParamsSchema,
  rfiIdParamsSchema,
  rfiListQuerySchema,
  createRfiSchema,
  updateRfiSchema,
} from './schemas';
import {
  createRfi,
  listRfis,
  getRfi,
  updateRfi,
  suggestRfiAnswer,
  getRfiAnalytics,
} from './service';

export const rfisRouter = Router({ mergeParams: true });

function getActor(req: Request) {
  const user = (req as AuthenticatedRequest).auth?.user;
  return {
    id: user?.id ?? '',
    role: user?.role ?? Role.VIEWER,
  };
}

rfisRouter.use((req, res, next) => {
  void requireAuth(req, res, next);
});

/**
 * GET /api/v1/projects/:id/rfis
 * List RFIs with optional status / overdue / assignee filters.
 */
rfisRouter.get(
  '/',
  requirePermission('view_dashboard'),
  asyncHandler(async (req: Request, res: Response) => {
    const params = rfiParamsSchema.parse(req.params);
    const query = rfiListQuerySchema.parse(req.query);

    const result = await listRfis({
      projectId: params.id,
      actor: getActor(req),
      status: query.status,
      overdue: query.overdue,
      assigneeId: query.assigneeId,
      limit: query.limit,
      offset: query.offset,
    });

    res.status(200).json(result);
  })
);

/**
 * GET /api/v1/projects/:id/rfis/analytics
 * RFI ageing buckets, overdue count, and resolution-time metrics.
 * NOTE: declared before /:rfiId so "analytics" is not treated as an id.
 */
rfisRouter.get(
  '/analytics',
  requirePermission('view_dashboard'),
  asyncHandler(async (req: Request, res: Response) => {
    const params = rfiParamsSchema.parse(req.params);
    const analytics = await getRfiAnalytics({ projectId: params.id, actor: getActor(req) });
    res.status(200).json(analytics);
  })
);

/**
 * POST /api/v1/projects/:id/rfis
 * Create a new RFI.
 */
rfisRouter.post(
  '/',
  requirePermission('manage_rfis'),
  asyncHandler(async (req: Request, res: Response) => {
    const params = rfiParamsSchema.parse(req.params);
    const body = createRfiSchema.parse(req.body);

    const rfi = await createRfi({ projectId: params.id, actor: getActor(req), data: body });
    res.status(201).json(rfi);
  })
);

/**
 * GET /api/v1/projects/:id/rfis/:rfiId
 * RFI detail.
 */
rfisRouter.get(
  '/:rfiId',
  requirePermission('view_dashboard'),
  asyncHandler(async (req: Request, res: Response) => {
    const params = rfiIdParamsSchema.parse(req.params);
    const rfi = await getRfi({ projectId: params.id, actor: getActor(req), rfiId: params.rfiId });
    res.status(200).json(rfi);
  })
);

/**
 * PUT /api/v1/projects/:id/rfis/:rfiId
 * Update an RFI (fields, status transition, resolution approval, document links).
 */
rfisRouter.put(
  '/:rfiId',
  requirePermission('manage_rfis'),
  asyncHandler(async (req: Request, res: Response) => {
    const params = rfiIdParamsSchema.parse(req.params);
    const body = updateRfiSchema.parse(req.body);

    const rfi = await updateRfi({
      projectId: params.id,
      actor: getActor(req),
      rfiId: params.rfiId,
      data: body,
    });

    res.status(200).json(rfi);
  })
);

/**
 * POST /api/v1/projects/:id/rfis/:rfiId/suggest-answer
 * Generate an AI-suggested answer via RAG (draft, requires human approval).
 */
rfisRouter.post(
  '/:rfiId/suggest-answer',
  requirePermission('manage_rfis'),
  asyncHandler(async (req: Request, res: Response) => {
    const params = rfiIdParamsSchema.parse(req.params);
    const rfi = await suggestRfiAnswer({
      projectId: params.id,
      actor: getActor(req),
      rfiId: params.rfiId,
    });

    res.status(200).json(rfi);
  })
);

export * from './service';
