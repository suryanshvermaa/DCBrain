import { Router, type Request, type Response } from 'express';
import { Role } from '@prisma/client';
import { asyncHandler } from '@/core/middleware/errorHandler';
import { requireAuth, requireRole } from '@/modules/auth/middleware';
import prisma from '@/lib/prisma';

export const adminRouter = Router();

adminRouter.use(requireAuth);
adminRouter.use(requireRole(Role.ADMIN));

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

    if (action) {
      where.action = action;
    }
    if (resourceType) {
      where.resourceType = resourceType;
    }
    if (userId) {
      where.userId = userId;
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
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
          ? {
              id: log.user.id,
              name: `${log.user.firstName} ${log.user.lastName}`,
              email: log.user.email,
            }
          : null,
      })),
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  })
);
