import { Router, type Request, type Response } from 'express';
import { Role } from '@prisma/client';
import { asyncHandler } from '@/core/middleware/errorHandler';
import { requireAuth, type AuthenticatedRequest } from '@/modules/auth/middleware';
import { validateBody } from '@/core/middleware/validation';
import { CreateSimulationSchema } from './schemas';
import { createAndRunSimulation, generateMitigationPlan, listSimulations, getSimulation } from './service';

const router = Router({ mergeParams: true });

// Apply auth to all routes
router.use(requireAuth);

function getActor(req: Request) {
  const user = (req as AuthenticatedRequest).auth?.user;
  return {
    id: user?.id ?? '',
    role: user?.role ?? Role.VIEWER,
  };
}

/**
 * @route POST /api/v1/projects/:id/simulations/delay
 */
router.post(
  '/delay',
  validateBody(CreateSimulationSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const actor = getActor(req);
    const result = await createAndRunSimulation({
      projectId: req.params['id'] as string,
      actor,
      name: req.body.name,
      description: req.body.description,
      targetActivityId: req.body.targetActivityId,
      delayDays: req.body.delayDays,
      assumptions: req.body.assumptions,
      userId: actor.id,
    });
    res.status(201).json(result);
  })
);

/**
 * @route GET /api/v1/projects/:id/simulations
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const simulations = await listSimulations(req.params['id'] as string, getActor(req));
    res.json(simulations);
  })
);

/**
 * @route GET /api/v1/projects/:id/simulations/:simId
 */
router.get(
  '/:simId',
  asyncHandler(async (req: Request, res: Response) => {
    const sim = await getSimulation(req.params['id'] as string, getActor(req), req.params['simId'] as string);
    if (!sim) {
      res.status(404).json({ error: 'Simulation not found' });
      return;
    }
    res.json(sim);
  })
);

/**
 * @route POST /api/v1/projects/:id/simulations/:simId/mitigate
 */
router.post(
  '/:simId/mitigate',
  asyncHandler(async (req: Request, res: Response) => {
    const actor = getActor(req);
    const result = await generateMitigationPlan(
      req.params['id'] as string,
      actor,
      req.params['simId'] as string,
      actor.id
    );
    res.json(result);
  })
);

export default router;
