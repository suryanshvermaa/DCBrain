import { Router, type Request, type Response } from 'express';
import { Role } from '@prisma/client';
import { asyncHandler } from '@/core/middleware/errorHandler';
import { requireAuth, requirePermission, type AuthenticatedRequest } from '@/modules/auth/middleware';
import { dashboardParamsSchema, dashboardQuerySchema } from './schemas';
import { getDashboardSummary } from './service';

export const dashboardRouter = Router({ mergeParams: true });

function getActor(req: Request) {
  const user = (req as AuthenticatedRequest).auth?.user;
  return {
    id: user?.id ?? '',
    role: user?.role ?? Role.VIEWER,
  };
}

dashboardRouter.use(requireAuth);

/**
 * GET /api/v1/projects/:id/dashboard/summary
 *
 * Returns aggregated dashboard data for the project:
 * - Composite health score (0–100)
 * - Document statistics
 * - Compliance summary
 * - Schedule risk overview
 * - Recent activity feed
 *
 * Query: ?refresh=true — bypass Redis cache
 */
dashboardRouter.get(
  '/summary',
  requirePermission('view_dashboard'),
  asyncHandler(async (req: Request, res: Response) => {
    const params = dashboardParamsSchema.parse(req.params);
    const query = dashboardQuerySchema.parse(req.query);

    const summary = await getDashboardSummary({
      projectId: params.id,
      actor: getActor(req),
      forceRefresh: query.refresh,
    });

    res.status(200).json(summary);
  }),
);

export * from './service';
