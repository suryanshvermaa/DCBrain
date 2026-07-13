import { Router, type Request, type Response } from 'express';
import multer from 'multer';
import { Role } from '@prisma/client';
import { asyncHandler } from '@/core/middleware/errorHandler';
import { requireAuth, requirePermission, type AuthenticatedRequest } from '@/modules/auth/middleware';
import { BadRequestError } from '@/core/errors';
import { scheduleParamsSchema, scheduleActivityQuerySchema } from './schemas';
import {
  importSchedule,
  getScheduleActivities,
  getScheduleRiskSummary,
  listScheduleImports,
} from './service';

export const scheduleRouter = Router({ mergeParams: true });

// Use memory storage — files are small XML exports (< 10 MB typical)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB hard limit
  fileFilter: (_req, file, cb) => {
    const allowed = ['application/xml', 'text/xml', 'application/octet-stream'];
    const isXml =
      allowed.includes(file.mimetype) ||
      file.originalname.toLowerCase().endsWith('.xml');
    if (!isXml) {
      cb(new BadRequestError('Only XML files are accepted for schedule import'));
    } else {
      cb(null, true);
    }
  },
});

function getActor(req: Request) {
  const user = (req as AuthenticatedRequest).auth?.user;
  return {
    id: user?.id ?? '',
    role: user?.role ?? Role.VIEWER,
  };
}

scheduleRouter.use(requireAuth);

/**
 * POST /api/v1/projects/:id/schedule/import
 * Import a P6 XML schedule file, compute risk scores, and persist activities.
 */
scheduleRouter.post(
  '/import',
  requirePermission('import_schedule_data'),
  upload.single('file'),
  asyncHandler(async (req: Request, res: Response) => {
    const params = scheduleParamsSchema.parse(req.params);

    if (!req.file) {
      throw new BadRequestError('No file uploaded. Send the XML file in a multipart field named "file".');
    }

    const result = await importSchedule({
      projectId: params.id,
      actor: getActor(req),
      fileBuffer: req.file.buffer,
      filename: req.file.originalname,
    });

    res.status(201).json(result);
  })
);

/**
 * GET /api/v1/projects/:id/schedule/activities
 * List schedule activities with optional risk level / critical path filters.
 */
scheduleRouter.get(
  '/activities',
  requirePermission('view_dashboard'),
  asyncHandler(async (req: Request, res: Response) => {
    const params = scheduleParamsSchema.parse(req.params);
    const query = scheduleActivityQuerySchema.parse(req.query);

    const result = await getScheduleActivities({
      projectId: params.id,
      actor: getActor(req),
      riskLevel: query.riskLevel,
      isCritical: query.isCritical,
      limit: query.limit,
      offset: query.offset,
    });

    res.status(200).json(result);
  })
);

/**
 * GET /api/v1/projects/:id/schedule/summary
 * Get schedule risk summary + health indicators.
 */
scheduleRouter.get(
  '/summary',
  requirePermission('view_dashboard'),
  asyncHandler(async (req: Request, res: Response) => {
    const params = scheduleParamsSchema.parse(req.params);
    const summary = await getScheduleRiskSummary({
      projectId: params.id,
      actor: getActor(req),
    });

    res.status(200).json(summary);
  })
);

/**
 * GET /api/v1/projects/:id/schedule/imports
 * List previous schedule import events.
 */
scheduleRouter.get(
  '/imports',
  requirePermission('view_dashboard'),
  asyncHandler(async (req: Request, res: Response) => {
    const params = scheduleParamsSchema.parse(req.params);
    const imports = await listScheduleImports({
      projectId: params.id,
      actor: getActor(req),
    });

    res.status(200).json(imports);
  })
);

export * from './service';
