import { Router, type Request, type Response } from 'express';
import { Role } from '@prisma/client';
import { asyncHandler } from '@/core/middleware/errorHandler';
import { requireAuth, requirePermission, type AuthenticatedRequest } from '@/modules/auth/middleware';
import {
  projectAgentParamsSchema,
  runAgentParamsSchema,
  runAgentBodySchema,
  updateAgentScheduleBodySchema,
} from './schemas';
import {
  listAgents,
  runAgentService,
  listAgentRuns,
  getAgentRunDetails,
  updateAgentScheduleService,
} from './service';
import type { AgentType } from './agent.types';

export const agentsRouter = Router({ mergeParams: true });

agentsRouter.use(requireAuth);

function getActor(req: Request) {
  const user = (req as AuthenticatedRequest).auth?.user;
  return {
    id: user?.id ?? '',
    role: user?.role ?? Role.VIEWER,
  };
}

// GET /api/v1/projects/:id/agents - List agent configs + latest run states
agentsRouter.get(
  '/',
  requirePermission('view_dashboard'),
  asyncHandler(async (req: Request, res: Response) => {
    const params = projectAgentParamsSchema.parse(req.params);
    const agents = await listAgents(params.id, getActor(req));
    res.status(200).json(agents);
  })
);

// POST /api/v1/projects/:id/agents/:type/run - Run agent manually (sync or async)
agentsRouter.post(
  '/:type/run',
  requirePermission('view_dashboard'),
  asyncHandler(async (req: Request, res: Response) => {
    const params = runAgentParamsSchema.parse(req.params);
    const body = runAgentBodySchema.parse(req.body);
    const actor = getActor(req);

    const result = await runAgentService({
      projectId: params.id,
      agentType: params.type as AgentType,
      input: {
        projectId: params.id,
        query: body.query,
        documentIds: body.documentIds,
        standards: body.standards,
        notes: body.notes,
      },
      actor,
      userId: actor.id,
      runAsync: body.runAsync,
    });

    res.status(200).json(result);
  })
);

// GET /api/v1/projects/:id/agents/runs - Get run history for a project
agentsRouter.get(
  '/runs',
  requirePermission('view_dashboard'),
  asyncHandler(async (req: Request, res: Response) => {
    const params = projectAgentParamsSchema.parse(req.params);
    const agentType = req.query['agentType'] ? (String(req.query['agentType']) as AgentType) : undefined;
    const runs = await listAgentRuns(params.id, getActor(req), agentType);
    res.status(200).json(runs);
  })
);

// GET /api/v1/projects/:id/agents/runs/:runId - Details of a single run
agentsRouter.get(
  '/runs/:runId',
  requirePermission('view_dashboard'),
  asyncHandler(async (req: Request, res: Response) => {
    const params = projectAgentParamsSchema.parse(req.params);
    const runId = req.params['runId']!;
    const run = await getAgentRunDetails(params.id, getActor(req), runId);
    if (!run) {
      res.status(404).json({ error: 'Agent run not found' });
      return;
    }
    res.status(200).json(run);
  })
);

// PUT /api/v1/projects/:id/agents/schedule - Configure an agent repeatable schedule
agentsRouter.put(
  '/schedule',
  requirePermission('configure_agents'),
  asyncHandler(async (req: Request, res: Response) => {
    const params = projectAgentParamsSchema.parse(req.params);
    const body = updateAgentScheduleBodySchema.parse(req.body);

    const schedule = await updateAgentScheduleService({
      projectId: params.id,
      agentType: body.agentType as AgentType,
      actor: getActor(req),
      schedule: body.schedule,
      isActive: body.isActive,
    });

    res.status(200).json(schedule);
  })
);
