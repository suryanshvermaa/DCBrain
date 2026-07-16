import { Router, type Request, type Response } from 'express';
import { Role } from '@prisma/client';
import { asyncHandler } from '@/core/middleware/errorHandler';
import {
  requireAuth,
  requirePermission,
  type AuthenticatedRequest,
} from '@/modules/auth/middleware';
import {
  cxParamsSchema,
  cxIdParamsSchema,
  cxListQuerySchema,
  createCxSchema,
  updateCxSchema,
} from './schemas';
import {
  createCommissioning,
  listCommissioning,
  getCommissioning,
  updateCommissioning,
  getCommissioningSummary,
} from './service';

export const commissioningRouter = Router({ mergeParams: true });

function getActor(req: Request) {
  const user = (req as AuthenticatedRequest).auth?.user;
  return {
    id: user?.id ?? '',
    role: user?.role ?? Role.VIEWER,
  };
}

commissioningRouter.use((req, res, next) => {
  void requireAuth(req, res, next);
});

/**
 * GET /api/v1/projects/:id/commissioning
 */
commissioningRouter.get(
  '/',
  requirePermission('view_dashboard'),
  asyncHandler(async (req: Request, res: Response) => {
    const params = cxParamsSchema.parse(req.params);
    const query = cxListQuerySchema.parse(req.query);

    const result = await listCommissioning({
      projectId: params.id,
      actor: getActor(req),
      status: query.status,
      discipline: query.discipline,
      limit: query.limit,
      offset: query.offset,
    });

    res.status(200).json(result);
  })
);

/**
 * GET /api/v1/projects/:id/commissioning/summary
 */
commissioningRouter.get(
  '/summary',
  requirePermission('view_dashboard'),
  asyncHandler(async (req: Request, res: Response) => {
    const params = cxParamsSchema.parse(req.params);
    const summary = await getCommissioningSummary({ projectId: params.id, actor: getActor(req) });
    res.status(200).json(summary);
  })
);

/**
 * POST /api/v1/projects/:id/commissioning
 */
commissioningRouter.post(
  '/',
  requirePermission('manage_rfis'),
  asyncHandler(async (req: Request, res: Response) => {
    const params = cxParamsSchema.parse(req.params);
    const body = createCxSchema.parse(req.body);
    const record = await createCommissioning({
      projectId: params.id,
      actor: getActor(req),
      data: body,
    });
    res.status(201).json(record);
  })
);

/**
 * GET /api/v1/projects/:id/commissioning/:cxId
 */
commissioningRouter.get(
  '/:cxId',
  requirePermission('view_dashboard'),
  asyncHandler(async (req: Request, res: Response) => {
    const params = cxIdParamsSchema.parse(req.params);
    const record = await getCommissioning({
      projectId: params.id,
      actor: getActor(req),
      cxId: params.cxId,
    });
    res.status(200).json(record);
  })
);

/**
 * PUT /api/v1/projects/:id/commissioning/:cxId
 */
commissioningRouter.put(
  '/:cxId',
  requirePermission('manage_rfis'),
  asyncHandler(async (req: Request, res: Response) => {
    const params = cxIdParamsSchema.parse(req.params);
    const body = updateCxSchema.parse(req.body);
    const record = await updateCommissioning({
      projectId: params.id,
      actor: getActor(req),
      cxId: params.cxId,
      data: body,
    });
    res.status(200).json(record);
  })
);

export * from './service';
