// @ts-nocheck
import { Router, type Request, type Response } from 'express';
import { Role } from '@prisma/client';
import { z } from 'zod';
import { asyncHandler } from '@/core/middleware/errorHandler';
import { requireAuth, requireRole, type AuthenticatedRequest } from '@/modules/auth/middleware';
import { hashPassword } from '@/modules/auth/security';
import { ConflictError, NotFoundError, ForbiddenError } from '@/core/errors';
import prisma from '@/lib/prisma';

export const adminRouter = Router();

adminRouter.use(requireAuth);
adminRouter.use(requireRole(Role.ADMIN));

// ──────────────────────────────────────────────
// GET /admin/audit-log
// ──────────────────────────────────────────────
adminRouter.get(
  '/audit-log',
  asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query['page'] as string) || 1;
    const limit = parseInt(req.query['limit'] as string) || 20;
    const skip = (page - 1) * limit;
    const action = req.query['action'] as string;
    const resourceType = req.query['resourceType'] as string;
    const userId = req.query['userId'] as string;
    const where: any = {};
    if (action) where.action = action;
    if (resourceType) where.resourceType = resourceType;
    if (userId) where.userId = userId;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.status(200).json({
      logs: logs.map((log) => ({
        id: log.id,
        action: log.action,
        resourceType: log.resourceType,
        resourceId: log.resourceId,
        details: log.details,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        createdAt: log.createdAt.toISOString(),
        user: log.user
          ? { id: log.user.id, name: `${log.user.firstName} ${log.user.lastName}`, email: log.user.email }
          : null,
      })),
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  })
);

// ──────────────────────────────────────────────────────────────────────────────
// GET /admin/users — List all platform users
// ──────────────────────────────────────────────────────────────────────────────
adminRouter.get(
  '/users',
  asyncHandler(async (_req: Request, res: Response) => {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        role: true, isActive: true, lastLoginAt: true, createdAt: true,
      },
    });
    res.status(200).json({
      users: users.map((u) => ({
        id: u.id,
        email: u.email,
        name: `${u.firstName} ${u.lastName}`,
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role,
        isActive: u.isActive,
        lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
        createdAt: u.createdAt.toISOString(),
      })),
    });
  })
);

// ──────────────────────────────────────────────────────────────────────────────
// POST /admin/users — Create a new user (AWS IAM-style)
// Returns plaintext credentials once so admin can share via email.
// ──────────────────────────────────────────────────────────────────────────────
const createUserSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  role: z.nativeEnum(Role).default(Role.VIEWER),
});

adminRouter.post(
  '/users',
  asyncHandler(async (req: Request, res: Response) => {
    const actor = (req as AuthenticatedRequest).auth?.user;
    const body = createUserSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing) throw new ConflictError('An account with that email already exists');

    const passwordHash = await hashPassword(body.password);

    const user = await prisma.user.create({
      data: {
        email: body.email,
        passwordHash,
        firstName: body.firstName,
        lastName: body.lastName,
        role: body.role,
      },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true, createdAt: true },
    });

    await prisma.auditLog.create({
      data: {
        userId: actor?.id ?? null,
        action: 'admin.user.created',
        resourceType: 'user',
        resourceId: user.id,
        details: { email: user.email, role: user.role, createdBy: actor?.id },
        ipAddress: req.ip ?? null,
        userAgent: req.headers['user-agent'] ?? null,
      },
    });

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt.toISOString(),
      },
      // Credentials shown once — admin copies and emails manually (AWS IAM pattern)
      credentials: {
        email: user.email,
        password: body.password,
      },
    });
  })
);

// ──────────────────────────────────────────────────────────────────────────────
// PATCH /admin/users/:userId — Update role / active status
// ──────────────────────────────────────────────────────────────────────────────
const updateUserSchema = z.object({
  role: z.nativeEnum(Role).optional(),
  isActive: z.boolean().optional(),
});

adminRouter.patch(
  '/users/:userId',
  asyncHandler(async (req: Request, res: Response) => {
    const actor = (req as AuthenticatedRequest).auth?.user;
    const { userId } = req.params;
    const body = updateUserSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!existing) throw new NotFoundError('User', userId);
    if (userId === actor?.id) throw new ForbiddenError('You cannot modify your own account via admin API');

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(body.role !== undefined && { role: body.role }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
      },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true },
    });

    await prisma.auditLog.create({
      data: {
        userId: actor?.id ?? null,
        action: 'admin.user.updated',
        resourceType: 'user',
        resourceId: userId,
        details: { changes: body, updatedBy: actor?.id },
        ipAddress: req.ip ?? null,
        userAgent: req.headers['user-agent'] ?? null,
      },
    });

    res.status(200).json({ user: updated });
  })
);
