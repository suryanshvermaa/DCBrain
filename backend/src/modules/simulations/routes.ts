// @ts-nocheck
import { Router } from 'express';
import { requireAuth, type AuthenticatedRequest } from '@/modules/auth/middleware';
import { validateBody } from '@/core/middleware/validation';
import { CreateSimulationSchema } from './schemas';
import { createAndRunSimulation, generateMitigationPlan, listSimulations, getSimulation } from './service';

const router = Router({ mergeParams: true });

// Apply auth to all routes
router.use(requireAuth);

/**
 * @route POST /api/v1/projects/:projectId/simulations/delay
 */
router.post(
  '/delay',
  validateBody(CreateSimulationSchema),
  async (req, res, next) => {
    try {
      const result = await createAndRunSimulation({
        projectId: req.params.id,
        name: req.body.name,
        description: req.body.description,
        targetActivityId: req.body.targetActivityId,
        delayDays: req.body.delayDays,
        assumptions: req.body.assumptions,
        userId: (req as AuthenticatedRequest).auth!.user.id,
      });
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @route GET /api/v1/projects/:projectId/simulations
 */
router.get(
  '/',
  async (req, res, next) => {
    try {
      const simulations = await listSimulations(req.params.id);
      res.json(simulations);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @route GET /api/v1/projects/:projectId/simulations/:simId
 */
router.get(
  '/:simId',
  async (req, res, next) => {
    try {
      const sim = await getSimulation(req.params.id, req.params.simId);
      if (!sim) {
        return res.status(404).json({ error: 'Simulation not found' });
      }
      res.json(sim);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @route POST /api/v1/projects/:projectId/simulations/:simId/mitigate
 */
router.post(
  '/:simId/mitigate',
  async (req, res, next) => {
    try {
      const result = await generateMitigationPlan(
        req.params.id,
        req.params.simId,
        (req as AuthenticatedRequest).auth!.user.id
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
