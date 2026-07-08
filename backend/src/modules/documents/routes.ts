import multer from 'multer';
import { Router, type Request, type Response } from 'express';
import { Role } from '@prisma/client';
import { asyncHandler } from '@/core/middleware/errorHandler';
import { requireAuth, requirePermission, type AuthenticatedRequest } from '@/modules/auth/middleware';
import config from '@/core/config';
import {
  documentParamsSchema,
  listDocumentsQuerySchema,
  projectDocumentsParamsSchema,
  uploadDocumentsSchema,
} from './schemas';
import {
  deleteProjectDocument,
  getDocumentDownloadUrl,
  getProjectDocument,
  listProjectDocuments,
  uploadDocuments,
} from './service';

export const documentsRouter = Router({ mergeParams: true });

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.MAX_UPLOAD_SIZE_MB * 1024 * 1024,
    files: 50,
  },
});

function getActor(req: Request) {
  const user = (req as AuthenticatedRequest).auth?.user;
  return {
    id: user?.id ?? '',
    role: user?.role ?? Role.VIEWER,
  };
}

documentsRouter.use(requireAuth);

documentsRouter.post(
  '/upload',
  requirePermission('upload_documents'),
  upload.array('files', 50),
  asyncHandler(async (req: Request, res: Response) => {
    const params = projectDocumentsParamsSchema.parse(req.params);
    const body = uploadDocumentsSchema.parse(req.body);
    const files = Array.isArray(req.files) ? req.files : [];
    const result = await uploadDocuments({
      projectId: params.id,
      actor: getActor(req),
      files,
      category: body.category,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    res.status(201).json(result);
  })
);

documentsRouter.get(
  '/',
  requirePermission('search_documents'),
  asyncHandler(async (req: Request, res: Response) => {
    const params = projectDocumentsParamsSchema.parse(req.params);
    const query = listDocumentsQuerySchema.parse(req.query);
    const result = await listProjectDocuments({
      projectId: params.id,
      actor: getActor(req),
      query,
    });
    res.status(200).json(result);
  })
);

documentsRouter.get(
  '/:documentId',
  requirePermission('search_documents'),
  asyncHandler(async (req: Request, res: Response) => {
    const params = documentParamsSchema.parse(req.params);
    const document = await getProjectDocument({
      projectId: params.id,
      documentId: params.documentId,
      actor: getActor(req),
    });
    res.status(200).json({ document });
  })
);

documentsRouter.get(
  '/:documentId/download-url',
  requirePermission('search_documents'),
  asyncHandler(async (req: Request, res: Response) => {
    const params = documentParamsSchema.parse(req.params);
    const result = await getDocumentDownloadUrl({
      projectId: params.id,
      documentId: params.documentId,
      actor: getActor(req),
    });
    res.status(200).json(result);
  })
);

documentsRouter.delete(
  '/:documentId',
  requirePermission('delete_documents'),
  asyncHandler(async (req: Request, res: Response) => {
    const params = documentParamsSchema.parse(req.params);
    await deleteProjectDocument({
      projectId: params.id,
      documentId: params.documentId,
      actor: getActor(req),
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    res.status(204).send();
  })
);

export * from './service';
