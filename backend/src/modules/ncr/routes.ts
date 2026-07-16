import { Router, type Request, type Response } from 'express';
import { Role } from '@prisma/client';
import { asyncHandler } from '@/core/middleware/errorHandler';
import {
  requireAuth,
  requirePermission,
  type AuthenticatedRequest,
} from '@/modules/auth/middleware';
import {
  ncrParamsSchema,
  ncrIdParamsSchema,
  ncrListQuerySchema,
  createNcrSchema,
  updateNcrSchema,
} from './schemas';
import { createNcr, listNcrs, getNcr, updateNcr, getNcrAnalytics } from './service';

export const ncrRouter = Router({ mergeParams: true });

function getActor(req: Request) {
  const user = (req as AuthenticatedRequest).auth?.user;
  return {
    id: user?.id ?? '',
    role: user?.role ?? Role.VIEWER,
  };
}

ncrRouter.use((req, res, next) => {
  void requireAuth(req, res, next);
});

/**
 * GET /api/v1/projects/:id/ncrs
 */
ncrRouter.get(
  '/',
  requirePermission('view_dashboard'),
  asyncHandler(async (req: Request, res: Response) => {
    const params = ncrParamsSchema.parse(req.params);
    const query = ncrListQuerySchema.parse(req.query);

    const result = await listNcrs({
      projectId: params.id,
      actor: getActor(req),
      status: query.status,
      severity: query.severity,
      vendorId: query.vendorId,
      limit: query.limit,
      offset: query.offset,
    });

    res.status(200).json(result);
  })
);

/**
 * GET /api/v1/projects/:id/ncrs/analytics
 */
ncrRouter.get(
  '/analytics',
  requirePermission('view_dashboard'),
  asyncHandler(async (req: Request, res: Response) => {
    const params = ncrParamsSchema.parse(req.params);
    const analytics = await getNcrAnalytics({ projectId: params.id, actor: getActor(req) });
    res.status(200).json(analytics);
  })
);

/**
 * POST /api/v1/projects/:id/ncrs
 */
ncrRouter.post(
  '/',
  requirePermission('manage_rfis'),
  asyncHandler(async (req: Request, res: Response) => {
    const params = ncrParamsSchema.parse(req.params);
    const body = createNcrSchema.parse(req.body);
    const ncr = await createNcr({ projectId: params.id, actor: getActor(req), data: body });
    res.status(201).json(ncr);
  })
);

/**
 * GET /api/v1/projects/:id/ncrs/:ncrId
 */
ncrRouter.get(
  '/:ncrId',
  requirePermission('view_dashboard'),
  asyncHandler(async (req: Request, res: Response) => {
    const params = ncrIdParamsSchema.parse(req.params);
    const ncr = await getNcr({ projectId: params.id, actor: getActor(req), ncrId: params.ncrId });
    res.status(200).json(ncr);
  })
);

/**
 * PUT /api/v1/projects/:id/ncrs/:ncrId
 */
ncrRouter.put(
  '/:ncrId',
  requirePermission('manage_rfis'),
  asyncHandler(async (req: Request, res: Response) => {
    const params = ncrIdParamsSchema.parse(req.params);
    const body = updateNcrSchema.parse(req.body);
    const ncr = await updateNcr({
      projectId: params.id,
      actor: getActor(req),
      ncrId: params.ncrId,
      data: body,
    });
    res.status(200).json(ncr);
  })
);

export * from './service';
