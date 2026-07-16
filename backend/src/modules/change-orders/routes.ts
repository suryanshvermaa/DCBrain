import { Router, type Request, type Response } from 'express';
import { Role } from '@prisma/client';
import { asyncHandler } from '@/core/middleware/errorHandler';
import {
  requireAuth,
  requirePermission,
  type AuthenticatedRequest,
} from '@/modules/auth/middleware';
import {
  coParamsSchema,
  coIdParamsSchema,
  coListQuerySchema,
  createCoSchema,
  updateCoSchema,
} from './schemas';
import {
  createChangeOrder,
  listChangeOrders,
  getChangeOrder,
  updateChangeOrder,
  getChangeOrderSummary,
} from './service';

export const changeOrdersRouter = Router({ mergeParams: true });

function getActor(req: Request) {
  const user = (req as AuthenticatedRequest).auth?.user;
  return {
    id: user?.id ?? '',
    role: user?.role ?? Role.VIEWER,
  };
}

changeOrdersRouter.use((req, res, next) => {
  void requireAuth(req, res, next);
});

/**
 * GET /api/v1/projects/:id/change-orders
 */
changeOrdersRouter.get(
  '/',
  requirePermission('view_dashboard'),
  asyncHandler(async (req: Request, res: Response) => {
    const params = coParamsSchema.parse(req.params);
    const query = coListQuerySchema.parse(req.query);

    const result = await listChangeOrders({
      projectId: params.id,
      actor: getActor(req),
      status: query.status,
      limit: query.limit,
      offset: query.offset,
    });

    res.status(200).json(result);
  })
);

/**
 * GET /api/v1/projects/:id/change-orders/summary
 */
changeOrdersRouter.get(
  '/summary',
  requirePermission('view_dashboard'),
  asyncHandler(async (req: Request, res: Response) => {
    const params = coParamsSchema.parse(req.params);
    const summary = await getChangeOrderSummary({
      projectId: params.id,
      actor: getActor(req),
    });
    res.status(200).json(summary);
  })
);

/**
 * POST /api/v1/projects/:id/change-orders
 */
changeOrdersRouter.post(
  '/',
  requirePermission('manage_rfis'),
  asyncHandler(async (req: Request, res: Response) => {
    const params = coParamsSchema.parse(req.params);
    const body = createCoSchema.parse(req.body);
    const co = await createChangeOrder({
      projectId: params.id,
      actor: getActor(req),
      data: body,
    });
    res.status(201).json(co);
  })
);

/**
 * GET /api/v1/projects/:id/change-orders/:coId
 */
changeOrdersRouter.get(
  '/:coId',
  requirePermission('view_dashboard'),
  asyncHandler(async (req: Request, res: Response) => {
    const params = coIdParamsSchema.parse(req.params);
    const co = await getChangeOrder({
      projectId: params.id,
      actor: getActor(req),
      coId: params.coId,
    });
    res.status(200).json(co);
  })
);

/**
 * PUT /api/v1/projects/:id/change-orders/:coId
 */
changeOrdersRouter.put(
  '/:coId',
  requirePermission('manage_rfis'),
  asyncHandler(async (req: Request, res: Response) => {
    const params = coIdParamsSchema.parse(req.params);
    const body = updateCoSchema.parse(req.body);
    const co = await updateChangeOrder({
      projectId: params.id,
      actor: getActor(req),
      coId: params.coId,
      data: body,
    });
    res.status(200).json(co);
  })
);

export * from './service';
