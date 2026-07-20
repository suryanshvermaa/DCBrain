import { Router, type Request, type Response } from 'express';
import { Role } from '@prisma/client';
import { asyncHandler } from '@/core/middleware/errorHandler';
import { requireAuth, requirePermission, type AuthenticatedRequest } from '@/modules/auth/middleware';
import { assertProjectAccess } from '@/modules/projects';
import {
  reportParamsSchema,
  reportDetailParamsSchema,
  generateReportBodySchema,
  reportDownloadQuerySchema,
  reportListQuerySchema,
} from './schemas';
import {
  generateReport,
  listReports,
  getReportDetail,
  getReportDownloadUrl,
} from './service';

export const reportsRouter = Router({ mergeParams: true });

reportsRouter.use(requireAuth);

function getActor(req: Request) {
  const user = (req as AuthenticatedRequest).auth?.user;
  return {
    id: user?.id ?? '',
    role: user?.role ?? Role.VIEWER,
  };
}

/**
 * POST /api/v1/projects/:id/reports/generate
 *
 * Generate a new report. Body: { type, runAsync? }
 */
reportsRouter.post(
  '/generate',
  requirePermission('view_dashboard'),
  asyncHandler(async (req: Request, res: Response) => {
    const params = reportParamsSchema.parse(req.params);
    const body = generateReportBodySchema.parse(req.body);
    const actor = getActor(req);

    const result = await generateReport({
      projectId: params.id,
      type: body.type,
      userId: actor.id,
      actor,
      runAsync: body.runAsync,
    });

    res.status(201).json(result);
  })
);

/**
 * GET /api/v1/projects/:id/reports
 *
 * List reports for a project. Query: ?type=, ?page=, ?pageSize=
 */
reportsRouter.get(
  '/',
  requirePermission('view_dashboard'),
  asyncHandler(async (req: Request, res: Response) => {
    const params = reportParamsSchema.parse(req.params);
    await assertProjectAccess(params.id, getActor(req));
    const query = reportListQuerySchema.parse(req.query);

    const result = await listReports(params.id, {
      type: query.type as any,
      page: query.page,
      pageSize: query.pageSize,
    });

    res.status(200).json(result);
  })
);

/**
 * GET /api/v1/projects/:id/reports/:reportId
 *
 * Get report detail including Markdown content.
 */
reportsRouter.get(
  '/:reportId',
  requirePermission('view_dashboard'),
  asyncHandler(async (req: Request, res: Response) => {
    const params = reportDetailParamsSchema.parse(req.params);
    await assertProjectAccess(params.id, getActor(req));

    const report = await getReportDetail(params.reportId, params.id);
    if (!report) {
      res.status(404).json({ error: 'Report not found' });
      return;
    }

    res.status(200).json(report);
  })
);

/**
 * GET /api/v1/projects/:id/reports/:reportId/download?format=pdf|md
 *
 * Get download URL (PDF) or raw Markdown content.
 */
reportsRouter.get(
  '/:reportId/download',
  requirePermission('view_dashboard'),
  asyncHandler(async (req: Request, res: Response) => {
    const params = reportDetailParamsSchema.parse(req.params);
    await assertProjectAccess(params.id, getActor(req));
    const query = reportDownloadQuerySchema.parse(req.query);

    if (query.format === 'pdf') {
      const report = await getReportDetail(params.reportId, params.id);
      if (!report || !report.storageKey) {
        res.status(404).json({ error: 'Report not found or not yet generated' });
        return;
      }

      const { getObjectStream } = await import('@/lib/minio');
      try {
        const stream = await getObjectStream(report.storageKey);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${report.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf"`);
        stream.pipe(res);
      } catch (error) {
        res.status(500).json({ error: 'Failed to download PDF' });
      }
      return;
    }

    const result = await getReportDownloadUrl(params.reportId, params.id, query.format);
    if (!result) {
      res.status(404).json({ error: 'Report not found or not yet generated' });
      return;
    }

    res.status(200).json(result);
  })
);
