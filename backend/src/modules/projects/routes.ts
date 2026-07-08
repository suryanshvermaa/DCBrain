import { Router, type Request, type Response } from 'express';
import { Role } from '@prisma/client';
import { asyncHandler } from '@/core/middleware/errorHandler';
import { requireAuth, requirePermission, type AuthenticatedRequest } from '@/modules/auth/middleware';
import { createProjectSchema, projectIdParamSchema } from './schemas';
import { createUserProject, getProject, listUserProjects } from './service';

export const projectsRouter = Router();

projectsRouter.use(requireAuth);

projectsRouter.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).auth?.user;
    const projects = await listUserProjects({ id: user?.id ?? '', role: user?.role ?? Role.VIEWER });
    res.status(200).json({ projects });
  })
);

projectsRouter.post(
  '/',
  requirePermission('create_projects'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).auth?.user;
    const input = createProjectSchema.parse(req.body);
    const project = await createUserProject({
      ...input,
      creatorId: user?.id ?? '',
    });
    res.status(201).json({ project });
  })
);

projectsRouter.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).auth?.user;
    const params = projectIdParamSchema.parse(req.params);
    const project = await getProject(params.id, { id: user?.id ?? '', role: user?.role ?? Role.VIEWER });
    res.status(200).json({ project });
  })
);

export * from './service';
