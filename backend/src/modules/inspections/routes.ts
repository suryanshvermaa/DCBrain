import { Router, type Request, type Response } from 'express';
import { Role } from '@prisma/client';
import { asyncHandler } from '@/core/middleware/errorHandler';
import {
  requireAuth,
  requirePermission,
  type AuthenticatedRequest,
} from '@/modules/auth/middleware';
import {
  inspectionParamsSchema,
  inspectionIdParamsSchema,
  inspectionListQuerySchema,
  createInspectionSchema,
  updateInspectionSchema,
} from './schemas';
import {
  createInspection,
  listInspections,
  getInspection,
  updateInspection,
  getInspectionSummary,
} from './service';

export const inspectionsRouter = Router({ mergeParams: true });

function getActor(req: Request) {
  const user = (req as AuthenticatedRequest).auth?.user;
  return {
    id: user?.id ?? '',
    role: user?.role ?? Role.VIEWER,
  };
}

inspectionsRouter.use((req, res, next) => {
  void requireAuth(req, res, next);
});

/**
 * GET /api/v1/projects/:id/inspections
 */
inspectionsRouter.get(
  '/',
  requirePermission('view_dashboard'),
  asyncHandler(async (req: Request, res: Response) => {
    const params = inspectionParamsSchema.parse(req.params);
    const query = inspectionListQuerySchema.parse(req.query);

    const result = await listInspections({
      projectId: params.id,
      actor: getActor(req),
      status: query.status,
      discipline: query.discipline,
      holdPoint: query.holdPoint,
      overdue: query.overdue,
      limit: query.limit,
      offset: query.offset,
    });

    res.status(200).json(result);
  })
);

/**
 * GET /api/v1/projects/:id/inspections/summary
 */
inspectionsRouter.get(
  '/summary',
  requirePermission('view_dashboard'),
  asyncHandler(async (req: Request, res: Response) => {
    const params = inspectionParamsSchema.parse(req.params);
    const summary = await getInspectionSummary({ projectId: params.id, actor: getActor(req) });
    res.status(200).json(summary);
  })
);

/**
 * POST /api/v1/projects/:id/inspections
 */
inspectionsRouter.post(
  '/',
  requirePermission('manage_rfis'),
  asyncHandler(async (req: Request, res: Response) => {
    const params = inspectionParamsSchema.parse(req.params);
    const body = createInspectionSchema.parse(req.body);
    const inspection = await createInspection({
      projectId: params.id,
      actor: getActor(req),
      data: body,
    });
    res.status(201).json(inspection);
  })
);

/**
 * GET /api/v1/projects/:id/inspections/:inspId
 */
inspectionsRouter.get(
  '/:inspId',
  requirePermission('view_dashboard'),
  asyncHandler(async (req: Request, res: Response) => {
    const params = inspectionIdParamsSchema.parse(req.params);
    const inspection = await getInspection({
      projectId: params.id,
      actor: getActor(req),
      inspId: params.inspId,
    });
    res.status(200).json(inspection);
  })
);

/**
 * PUT /api/v1/projects/:id/inspections/:inspId
 */
inspectionsRouter.put(
  '/:inspId',
  requirePermission('manage_rfis'),
  asyncHandler(async (req: Request, res: Response) => {
    const params = inspectionIdParamsSchema.parse(req.params);
    const body = updateInspectionSchema.parse(req.body);
    const inspection = await updateInspection({
      projectId: params.id,
      actor: getActor(req),
      inspId: params.inspId,
      data: body,
    });
    res.status(200).json(inspection);
  })
);

export * from './service';
