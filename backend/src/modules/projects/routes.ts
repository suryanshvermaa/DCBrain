// @ts-nocheck
import { Router, type Request, type Response } from 'express';
import { Role, ProjectRole } from '@prisma/client';
import crypto from 'crypto';
import { asyncHandler } from '@/core/middleware/errorHandler';
import { requireAuth, requirePermission, type AuthenticatedRequest } from '@/modules/auth/middleware';
import { createProjectSchema, projectIdParamSchema, inviteMemberSchema, updateMemberRoleSchema, memberUserIdParamSchema } from './schemas';
import { createUserProject, getProject, listUserProjects, assertProjectAccess } from './service';
import { hashPassword } from '@/modules/auth/security';
import prisma from '@/lib/prisma';
import { ForbiddenError, NotFoundError } from '@/core/errors';

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
          select: { id: true, firstName: true, lastName: true, email: true, role: true }
        }
      }
    });

    res.status(200).json({
      members: members.map(m => ({
        id: m.user.id,
        name: `${m.user.firstName} ${m.user.lastName}`,
        email: m.user.email,
        globalRole: m.user.role,
        role: m.role,
        joinedAt: m.joinedAt.toISOString(),
      }))
    });
  })
);

// ──────────────────────────────────────────────
// POST /:id/members — Invite a user to a project
// ──────────────────────────────────────────────
projectsRouter.post(
  '/:id/members',
  requirePermission('manage_project_members'),
  asyncHandler(async (req: Request, res: Response) => {
    const actor = (req as AuthenticatedRequest).auth?.user;
    const params = projectIdParamSchema.parse(req.params);
    const body = inviteMemberSchema.parse(req.body);

    await assertProjectAccess(params.id, { id: actor?.id ?? '', role: actor?.role ?? Role.VIEWER });

    // Verify actor has project-level authority (OWNER or MANAGER), unless global ADMIN/PM
    const isGlobalAuthority = actor?.role === Role.ADMIN || actor?.role === Role.PROJECT_MANAGER;
    if (!isGlobalAuthority) {
      const actorMembership = await prisma.projectMember.findUnique({
        where: { userId_projectId: { userId: actor?.id ?? '', projectId: params.id } },
        select: { role: true },
      });
      if (!actorMembership || (actorMembership.role !== ProjectRole.OWNER && actorMembership.role !== ProjectRole.MANAGER)) {
        throw new ForbiddenError('Only project Owners or Managers can invite members');
      }
    }

    // Prevent inviting someone as OWNER (there can only be one project creator owner)
    if (body.role === ProjectRole.OWNER) {
      throw new ForbiddenError('Cannot assign OWNER role via invite');
    }

    // Find or create the user
    let targetUser = await prisma.user.findUnique({ where: { email: body.email } });
    let isNewUser = false;

    if (!targetUser) {
      isNewUser = true;
      const tempPassword = crypto.randomBytes(16).toString('hex');
      const passwordHash = await hashPassword(tempPassword);
      const nameParts = body.email.split('@')[0].split('.');
      targetUser = await prisma.user.create({
        data: {
          email: body.email,
          passwordHash,
          firstName: nameParts[0] ? nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1) : 'Invited',
          lastName: nameParts[1] ? nameParts[1].charAt(0).toUpperCase() + nameParts[1].slice(1) : 'User',
          role: Role.VIEWER,
        },
      });
    }

    // Upsert project membership
    const membership = await prisma.projectMember.upsert({
      where: { userId_projectId: { userId: targetUser.id, projectId: params.id } },
      update: { role: body.role },
      create: { userId: targetUser.id, projectId: params.id, role: body.role },
    });

    res.status(201).json({
      member: {
        id: targetUser.id,
        name: `${targetUser.firstName} ${targetUser.lastName}`,
        email: targetUser.email,
        globalRole: targetUser.role,
        role: membership.role,
        joinedAt: membership.joinedAt.toISOString(),
        isNewUser,
      }
    });
  })
);

// ─────────────────────────────────────────────────────────
// PATCH /:id/members/:userId — Update a member's ProjectRole
// ─────────────────────────────────────────────────────────
projectsRouter.patch(
  '/:id/members/:userId',
  requirePermission('manage_project_members'),
  asyncHandler(async (req: Request, res: Response) => {
    const actor = (req as AuthenticatedRequest).auth?.user;
    const params = memberUserIdParamSchema.parse(req.params);
    const body = updateMemberRoleSchema.parse(req.body);

    await assertProjectAccess(params.id, { id: actor?.id ?? '', role: actor?.role ?? Role.VIEWER });

    // Verify actor has project-level authority
    const isGlobalAuthority = actor?.role === Role.ADMIN || actor?.role === Role.PROJECT_MANAGER;
    if (!isGlobalAuthority) {
      const actorMembership = await prisma.projectMember.findUnique({
        where: { userId_projectId: { userId: actor?.id ?? '', projectId: params.id } },
        select: { role: true },
      });
      if (!actorMembership || (actorMembership.role !== ProjectRole.OWNER && actorMembership.role !== ProjectRole.MANAGER)) {
        throw new ForbiddenError('Only project Owners or Managers can modify member roles');
      }
    }

    // Protect the OWNER — cannot change their role
    const targetMembership = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: params.userId, projectId: params.id } },
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true, role: true } } },
    });
    if (!targetMembership) {
      throw new NotFoundError('ProjectMember', params.userId);
    }
    if (targetMembership.role === ProjectRole.OWNER) {
      throw new ForbiddenError('Cannot change the role of the project Owner');
    }
    if (body.role === ProjectRole.OWNER) {
      throw new ForbiddenError('Cannot promote a member to Owner');
    }

    const updated = await prisma.projectMember.update({
      where: { userId_projectId: { userId: params.userId, projectId: params.id } },
      data: { role: body.role },
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true, role: true } } },
    });

    res.status(200).json({
      member: {
        id: updated.user.id,
        name: `${updated.user.firstName} ${updated.user.lastName}`,
        email: updated.user.email,
        globalRole: updated.user.role,
        role: updated.role,
        joinedAt: updated.joinedAt.toISOString(),
      }
    });
  })
);

// ─────────────────────────────────────────────────────────
// DELETE /:id/members/:userId — Remove a member from project
// ─────────────────────────────────────────────────────────
projectsRouter.delete(
  '/:id/members/:userId',
  requirePermission('manage_project_members'),
  asyncHandler(async (req: Request, res: Response) => {
    const actor = (req as AuthenticatedRequest).auth?.user;
    const params = memberUserIdParamSchema.parse(req.params);

    await assertProjectAccess(params.id, { id: actor?.id ?? '', role: actor?.role ?? Role.VIEWER });

    // Verify actor has project-level authority
    const isGlobalAuthority = actor?.role === Role.ADMIN || actor?.role === Role.PROJECT_MANAGER;
    if (!isGlobalAuthority) {
      const actorMembership = await prisma.projectMember.findUnique({
        where: { userId_projectId: { userId: actor?.id ?? '', projectId: params.id } },
        select: { role: true },
      });
      if (!actorMembership || (actorMembership.role !== ProjectRole.OWNER && actorMembership.role !== ProjectRole.MANAGER)) {
        throw new ForbiddenError('Only project Owners or Managers can remove members');
      }
    }

    // Protect the OWNER — cannot remove
    const targetMembership = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: params.userId, projectId: params.id } },
      select: { role: true },
    });
    if (!targetMembership) {
      throw new NotFoundError('ProjectMember', params.userId);
    }
    if (targetMembership.role === ProjectRole.OWNER) {
      throw new ForbiddenError('Cannot remove the project Owner');
    }

    await prisma.projectMember.delete({
      where: { userId_projectId: { userId: params.userId, projectId: params.id } },
    });

    res.status(204).send();
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

