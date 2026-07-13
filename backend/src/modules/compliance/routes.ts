import { Router, type Request, type Response } from 'express';
import { Role } from '@prisma/client';
import { asyncHandler } from '@/core/middleware/errorHandler';
import { requireAuth, requirePermission, type AuthenticatedRequest } from '@/modules/auth/middleware';
import { projectComplianceParamsSchema, complianceCheckSchema } from './schemas';
import { getComplianceSummary, runComplianceCheck } from './service';

export const complianceRouter = Router({ mergeParams: true });

function getActor(req: Request) {
  const user = (req as AuthenticatedRequest).auth?.user;
  return {
    id: user?.id ?? '',
    role: user?.role ?? Role.VIEWER,
  };
}

complianceRouter.use(requireAuth);

complianceRouter.post(
  '/check',
  requirePermission('run_compliance_checks'),
  asyncHandler(async (req: Request, res: Response) => {
    const params = projectComplianceParamsSchema.parse(req.params);
    const body = complianceCheckSchema.parse(req.body);
    const result = await runComplianceCheck({
      projectId: params.id,
      actor: getActor(req),
      documentIds: body.documentIds,
      standards: body.standards,
      notes: body.notes,
    });

    res.status(200).json(result);
  })
);

complianceRouter.get(
  '/summary',
  requirePermission('view_dashboard'),
  asyncHandler(async (req: Request, res: Response) => {
    const params = projectComplianceParamsSchema.parse(req.params);
    const summary = await getComplianceSummary({
      projectId: params.id,
      actor: getActor(req),
    });

    res.status(200).json(summary);
  })
);

export * from './service';
