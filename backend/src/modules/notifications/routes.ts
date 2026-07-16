import { Router, type Request, type Response } from 'express';
import { asyncHandler } from '@/core/middleware/errorHandler';
import { requireAuth, type AuthenticatedRequest } from '@/modules/auth/middleware';
import * as service from './service';
import { z } from 'zod';

export const notificationsRouter = Router();

notificationsRouter.use(requireAuth);

const updatePreferencesSchema = z.object({
  inApp: z.boolean().optional(),
  emailDigest: z.boolean().optional(),
});

notificationsRouter.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as AuthenticatedRequest).auth?.user.id;
    if (!userId) return;
    const notifications = await service.listNotifications(userId);
    res.status(200).json({ notifications });
  })
);

notificationsRouter.put(
  '/read-all',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as AuthenticatedRequest).auth?.user.id;
    if (!userId) return;
    await service.markAllAsRead(userId);
    res.status(200).json({ success: true, message: 'All notifications marked as read' });
  })
);

notificationsRouter.put(
  '/:id/read',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as AuthenticatedRequest).auth?.user.id;
    const { id } = req.params as { id: string };
    if (!userId) return;
    const notification = await service.markAsRead(id, userId);
    res.status(200).json({ notification });
  })
);

notificationsRouter.get(
  '/preferences',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as AuthenticatedRequest).auth?.user.id;
    if (!userId) return;
    const preferences = await service.getPreferences(userId);
    res.status(200).json({ preferences });
  })
);

notificationsRouter.put(
  '/preferences',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as AuthenticatedRequest).auth?.user.id;
    if (!userId) return;
    const input = updatePreferencesSchema.parse(req.body);
    const preferences = await service.updatePreferences(userId, input);
    res.status(200).json({ preferences });
  })
);
