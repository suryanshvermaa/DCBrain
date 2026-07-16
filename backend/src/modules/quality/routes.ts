import { Router, type Request, type Response } from 'express';
import { Role } from '@prisma/client';
import { asyncHandler } from '@/core/middleware/errorHandler';
import { requireAuth, requirePermission, type AuthenticatedRequest } from '@/modules/auth/middleware';
import { assertProjectAccess } from '@/modules/projects';
import { logger } from '@/lib/logger';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { InspectionStatus, CommissioningStatus, NcrStatus } from '@prisma/client';

const qualityParamsSchema = z.object({ id: z.string().min(1) });

export const qualityRouter = Router({ mergeParams: true });

function getActor(req: Request) {
  const user = (req as AuthenticatedRequest).auth?.user;
  return { id: user?.id ?? '', role: user?.role ?? Role.VIEWER };
}

qualityRouter.use((req, res, next) => {
  void requireAuth(req, res, next);
});

/**
 * GET /api/v1/projects/:id/quality/summary
 *
 * Quality score formula:
 *   0.40 × inspectionPassRate
 *   0.35 × cxPassRate
 *   0.25 × ncrHealthScore  (100 - clamp(open NCRs / total * 200, 0, 100))
 */
qualityRouter.get(
  '/summary',
  requirePermission('view_dashboard'),
  asyncHandler(async (req: Request, res: Response) => {
    const params = qualityParamsSchema.parse(req.params);
    const actor = getActor(req);
    await assertProjectAccess(params.id, actor);

    logger.debug('Building quality summary', { projectId: params.id });

    // --- NCR stats ---
    const ncrs = await prisma.ncr.findMany({
      where: { projectId: params.id },
      select: { status: true, severity: true },
    });
    const ncrTotal = ncrs.length;
    const ncrOpen = ncrs.filter(
      (n) => n.status === NcrStatus.OPEN || n.status === NcrStatus.UNDER_REVIEW
    ).length;
    const ncrBySeverity = { MINOR: 0, MAJOR: 0, CRITICAL: 0 };
    for (const n of ncrs) ncrBySeverity[n.severity]++;
    // Health: 0 open NCRs = 100, many open = lower
    const ncrHealthScore = ncrTotal > 0
      ? Math.max(0, 100 - Math.round((ncrOpen / ncrTotal) * 200))
      : 100;

    // --- Inspection stats ---
    const inspections = await prisma.inspection.findMany({
      where: { projectId: params.id },
      select: { status: true },
    });
    const inspTotal = inspections.length;
    const inspPassed = inspections.filter((i) => i.status === InspectionStatus.PASSED).length;
    const inspFailed = inspections.filter((i) => i.status === InspectionStatus.FAILED).length;
    const inspCompleted = inspPassed + inspFailed;
    const inspPassRate = inspCompleted > 0 ? Math.round((inspPassed / inspCompleted) * 100) : 0;

    // --- Commissioning stats ---
    const cxRecords = await prisma.commissioningRecord.findMany({
      where: { projectId: params.id },
      select: { status: true },
    });
    const cxTotal = cxRecords.length;
    const cxPassed = cxRecords.filter(
      (c) => c.status === CommissioningStatus.PASSED || c.status === CommissioningStatus.CLOSED
    ).length;
    const cxFailed = cxRecords.filter((c) => c.status === CommissioningStatus.FAILED).length;
    const cxCompleted = cxPassed + cxFailed;
    const cxPassRate = cxCompleted > 0 ? Math.round((cxPassed / cxCompleted) * 100) : 0;

    // --- Composite quality score ---
    const qualityScore = Math.round(
      0.40 * inspPassRate + 0.35 * cxPassRate + 0.25 * ncrHealthScore
    );

    res.status(200).json({
      projectId: params.id,
      qualityScore,
      ncr: {
        total: ncrTotal,
        open: ncrOpen,
        bySeverity: ncrBySeverity,
        healthScore: ncrHealthScore,
      },
      inspection: {
        total: inspTotal,
        passed: inspPassed,
        failed: inspFailed,
        passRate: inspPassRate,
      },
      commissioning: {
        total: cxTotal,
        passed: cxPassed,
        failed: cxFailed,
        passRate: cxPassRate,
      },
      generatedAt: new Date().toISOString(),
    });
  })
);

export * from './service';
