import { Router, type Request, type Response } from 'express';
import { asyncHandler } from '@/core/middleware/errorHandler';
import { requireAuth, type AuthenticatedRequest } from '@/modules/auth/middleware';
import { requirePermission } from '@/modules/auth/middleware';
import { z } from 'zod';
import { createSessionSchema, sendMessageSchema, chatSessionQuerySchema } from './schemas';
import * as chatController from './chat.controller';

export const chatRouter = Router({ mergeParams: true });

chatRouter.use(requireAuth);

const projectParamsSchema = z.object({
  id: z.string().min(1),
});

const sessionParamsSchema = z.object({
  id: z.string().min(1),
  sid: z.string().min(1),
});

/** POST /api/v1/projects/:id/chat/sessions */
chatRouter.post(
  '/',
  requirePermission('search_documents'),
  asyncHandler(async (req: Request, res: Response) => {
    const { id: projectId } = projectParamsSchema.parse(req.params);
    const userId = (req as AuthenticatedRequest).auth?.user?.id ?? '';
    const body = createSessionSchema.parse(req.body);

    const session = await chatController.createSession(projectId, userId, body.title);
    res.status(201).json({ session });
  })
);

/** GET /api/v1/projects/:id/chat/sessions */
chatRouter.get(
  '/',
  requirePermission('search_documents'),
  asyncHandler(async (req: Request, res: Response) => {
    const { id: projectId } = projectParamsSchema.parse(req.params);
    const userId = (req as AuthenticatedRequest).auth?.user?.id ?? '';
    const query = chatSessionQuerySchema.parse(req.query);

    const result = await chatController.listSessions(projectId, userId, query.page, query.pageSize);
    res.status(200).json({
      sessions: result.sessions,
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total: result.total,
        totalPages: Math.ceil(result.total / query.pageSize),
      },
    });
  })
);

/** GET /api/v1/projects/:id/chat/sessions/:sid/messages */
chatRouter.get(
  '/:sid/messages',
  requirePermission('search_documents'),
  asyncHandler(async (req: Request, res: Response) => {
    const { id: projectId, sid: sessionId } = sessionParamsSchema.parse(req.params);
    const userId = (req as AuthenticatedRequest).auth?.user?.id ?? '';

    const messages = await chatController.getSessionMessages(sessionId, projectId, userId);
    res.status(200).json({ messages });
  })
);

/** POST /api/v1/projects/:id/chat/sessions/:sid/messages */
chatRouter.post(
  '/:sid/messages',
  requirePermission('search_documents'),
  asyncHandler(async (req: Request, res: Response) => {
    const { id: projectId, sid: sessionId } = sessionParamsSchema.parse(req.params);
    const userId = (req as AuthenticatedRequest).auth?.user?.id ?? '';
    const body = sendMessageSchema.parse(req.body);

    const message = await chatController.sendMessage(sessionId, projectId, userId, body.content);
    res.status(201).json({ message });
  })
);

/** GET /api/v1/projects/:id/chat/sessions/:sid/export */
chatRouter.get(
  '/:sid/export',
  requirePermission('search_documents'),
  asyncHandler(async (req: Request, res: Response) => {
    const { id: projectId, sid: sessionId } = sessionParamsSchema.parse(req.params);
    const userId = (req as AuthenticatedRequest).auth?.user?.id ?? '';

    const pdfBuffer = await chatController.exportSessionAsPDF(sessionId, projectId, userId);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=chat-export-${sessionId}.pdf`);
    res.send(pdfBuffer);
  })
);
