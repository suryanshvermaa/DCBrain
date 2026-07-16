// @ts-nocheck
import { Router, type Request, type Response } from 'express';
import { Role } from '@prisma/client';
import { asyncHandler } from '@/core/middleware/errorHandler';
import { requireAuth, requirePermission, type AuthenticatedRequest } from '@/modules/auth/middleware';
import { createProjectSchema, projectIdParamSchema } from './schemas';
import { createUserProject, getProject, listUserProjects, assertProjectAccess } from './service';
import prisma from '@/lib/prisma';

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

projectsRouter.get(
  '/:id/members',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).auth?.user;
    const params = projectIdParamSchema.parse(req.params);
    await assertProjectAccess(params.id, { id: user?.id ?? '', role: user?.role ?? Role.VIEWER });

    const members = await prisma.projectMember.findMany({
      where: { projectId: params.id },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      }
    });

    res.status(200).json({
      members: members.map(m => ({
        id: m.user.id,
        name: `${m.user.firstName} ${m.user.lastName}`,
        email: m.user.email,
        role: m.role
      }))
    });
  })
);

projectsRouter.get(
  '/:id/activity',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).auth?.user;
    const params = projectIdParamSchema.parse(req.params);
    await assertProjectAccess(params.id, { id: user?.id ?? '', role: user?.role ?? Role.VIEWER });

    const type = req.query['type'] as string;
    const userId = req.query['userId'] as string;

    const where: any = { projectId: params.id };
    if (type) {
      where.type = type;
    }
    if (userId) {
      where.userId = userId;
    }

    const activities = await prisma.activity.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      }
    });

    res.status(200).json({
      activities: activities.map(a => ({
        id: a.id,
        type: a.type,
        title: a.title,
        description: a.description,
        metadata: a.metadata,
        createdAt: a.createdAt.toISOString(),
        userName: `${a.user.firstName} ${a.user.lastName}`,
        userEmail: a.user.email
      }))
    });
  })
);

export * from './service';
