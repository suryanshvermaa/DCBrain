import { Router, type Request, type Response } from 'express';
import { Role } from '@prisma/client';
import { requireAuth, type AuthenticatedRequest } from '@/modules/auth/middleware';
import { asyncHandler } from '@/core/middleware/errorHandler';
import { assertProjectAccess } from '@/modules/projects';
import { BadRequestError } from '@/core/errors';
import { graphService } from './service';
import { GraphQuerySchema, GraphEntitiesQuerySchema } from './schemas';

export const graphRouter = Router({ mergeParams: true });

graphRouter.use(requireAuth);

function getActor(req: Request) {
  const user = (req as AuthenticatedRequest).auth?.user;
  return {
    id: user?.id ?? '',
    role: user?.role ?? Role.VIEWER,
  };
}

graphRouter.get(
  '/dependencies',
  asyncHandler(async (req: Request, res: Response) => {
    const projectId = req.params['id'] as string;
    await assertProjectAccess(projectId, getActor(req));
    const query = GraphQuerySchema.parse(req.query);
    const typesArray = query.types ? query.types.split(',').map((t) => t.trim()).filter(Boolean) : undefined;

    const result = await graphService.getProjectDependencies(projectId, query.depth, typesArray);
    res.json(result);
  })
);

graphRouter.get(
  '/failures',
  asyncHandler(async (req: Request, res: Response) => {
    const projectId = req.params['id'] as string;
    await assertProjectAccess(projectId, getActor(req));
    const root = req.query['root'] as string;
    if (!root || typeof root !== 'string') {
      throw new BadRequestError('root entity name is required in query params');
    }
    const query = GraphQuerySchema.parse(req.query);

    const result = await graphService.getFailurePropagation(projectId, root, query.depth);
    res.json(result);
  })
);

graphRouter.get(
  '/entities',
  asyncHandler(async (req: Request, res: Response) => {
    const projectId = req.params['id'] as string;
    await assertProjectAccess(projectId, getActor(req));
    const query = GraphEntitiesQuerySchema.parse(req.query);

    const result = await graphService.getEntities(projectId, query.limit);
    res.json({ data: result });
  })
);

graphRouter.get(
  '/entities/:entityName/related',
  asyncHandler(async (req: Request, res: Response) => {
    const projectId = req.params['id'] as string;
    await assertProjectAccess(projectId, getActor(req));
    const entityName = req.params['entityName'] as string;

    const result = await graphService.getRelatedEntities(projectId, entityName);
    res.json(result);
  })
);
