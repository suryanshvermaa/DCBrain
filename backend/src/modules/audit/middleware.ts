import type { Request, Response, NextFunction } from 'express';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';
import type { AuthenticatedRequest } from '@/modules/auth/middleware';

export interface AuditRequest extends Request {
  auditLogged?: boolean;
  auditAction?: string;
  auditResourceType?: string;
  auditResourceId?: string;
  auditDetails?: Record<string, any>;
}

export function auditMiddleware(req: Request, res: Response, next: NextFunction): void {
  const auditReq = req as AuditRequest;
  const ipAddress = req.ip ?? req.headers['x-forwarded-for']?.toString() ?? '127.0.0.1';
  const userAgent = req.headers['user-agent'] ?? null;

  res.on('finish', async () => {
    // If this request was already logged manually (e.g. inside a service), skip auto-logging
    if (auditReq.auditLogged) {
      return;
    }

    // Only log successful operations or login attempts (which we want to log even if they fail due to bad credentials, but for now we focus on status < 400 or login attempts)
    const isLoginAttempt = req.originalUrl.includes('/auth/login');
    if (res.statusCode >= 400 && !isLoginAttempt) {
      return;
    }

    try {
      const user = (req as AuthenticatedRequest).auth?.user;
      const userId = user?.id ?? null;

      let action: string | undefined = auditReq.auditAction;
      let resourceType: string | undefined = auditReq.auditResourceType;
      let resourceId: string | undefined = auditReq.auditResourceId;
      let details: Record<string, any> = auditReq.auditDetails ?? {};

      const method = req.method;
      const path = req.originalUrl;

      // Extract Project ID if present in route path
      const projectMatch = path.match(/\/v1\/projects\/([^/?#]+)/);
      const projectId = projectMatch ? projectMatch[1] : undefined;
      if (projectId) {
        details['projectId'] = projectId;
      }

      // Auto-determine action based on path and method if not set
      if (!action) {
        if (isLoginAttempt && method === 'POST') {
          action = 'auth.login';
          resourceType = 'user';
          resourceId = userId ?? undefined;
        } else if (path.includes('/auth/register') && method === 'POST') {
          action = 'auth.register';
          resourceType = 'user';
          resourceId = userId ?? undefined;
        } else if (path.includes('/auth/logout') && method === 'POST') {
          action = 'auth.logout';
          resourceType = 'user';
          resourceId = userId ?? undefined;
        } else if (path.includes('/documents') && method === 'POST') {
          action = 'document.upload';
          resourceType = 'document';
        } else if (path.includes('/documents') && method === 'DELETE') {
          action = 'document.delete';
          resourceType = 'document';
          const parts = path.split('/');
          const docIdIdx = parts.indexOf('documents') + 1;
          resourceId = parts[docIdIdx] ?? undefined;
        } else if (path.includes('/search') && method === 'GET') {
          action = 'search.query';
          resourceType = 'search';
          details['query'] = (req.query['q'] ?? req.query['query'] ?? '') as string;
        } else if (path.includes('/compliance') && method === 'POST') {
          action = 'compliance.check';
          resourceType = 'compliance';
        } else if (path.includes('/schedule/import') && method === 'POST') {
          action = 'schedule.import';
          resourceType = 'schedule';
        } else if (path.includes('/procurement/import') && method === 'POST') {
          action = 'procurement.import';
          resourceType = 'procurement';
        } else if (path.includes('/agents') && path.includes('/run') && method === 'POST') {
          action = 'agent.run';
          resourceType = 'agent';
        } else if (path.includes('/users') && path.includes('/role') && (method === 'PUT' || method === 'PATCH')) {
          action = 'auth.role_change';
          resourceType = 'user';
        }
      }

      if (action) {
        await prisma.auditLog.create({
          data: {
            action,
            resourceType: resourceType ?? null,
            resourceId: resourceId ?? null,
            details: Object.keys(details).length > 0 ? (details as any) : undefined,
            ipAddress,
            userAgent,
            userId,
          },
        });
      }
    } catch (err) {
      logger.error('Failed to auto-record audit log entry', { error: err });
    }
  });

  next();
}
