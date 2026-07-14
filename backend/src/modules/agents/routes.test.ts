import express from 'express';
import request from 'supertest';
import { agentsRouter } from './routes';

jest.mock('./service', () => ({
  listAgents: jest.fn(),
  runAgentService: jest.fn(),
  listAgentRuns: jest.fn(),
  getAgentRunDetails: jest.fn(),
  updateAgentScheduleService: jest.fn(),
}));

const mockService = jest.requireMock('./service') as {
  listAgents: jest.Mock;
  runAgentService: jest.Mock;
  listAgentRuns: jest.Mock;
  getAgentRunDetails: jest.Mock;
  updateAgentScheduleService: jest.Mock;
};

jest.mock('@/modules/auth/middleware', () => ({
  requireAuth: (_req: unknown, _res: unknown, next: () => void) => next(),
  requirePermission: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/v1/projects/:id/agents', agentsRouter);
  return app;
}

const MOCK_AGENTS = [
  {
    type: 'SUPERVISOR',
    name: 'Supervisor Agent',
    schedule: null,
    latestRun: null,
  },
  {
    type: 'DOCUMENT',
    name: 'Document Agent',
    schedule: { cron: '0 8 * * *', isActive: true },
    latestRun: {
      id: 'run-1',
      status: 'COMPLETED',
      createdAt: '2026-07-13T12:00:00.000Z',
      durationMs: 1200,
    },
  },
];

const MOCK_RUN = {
  id: 'run-1',
  agentType: 'DOCUMENT',
  status: 'COMPLETED',
  input: { projectId: 'proj-1' },
  output: { success: true, content: 'All documents processed.', confidence: 0.95 },
  error: null,
  durationMs: 1200,
  costEstimate: 0.001,
  projectId: 'proj-1',
  createdAt: '2026-07-13T12:00:00.000Z',
  updatedAt: '2026-07-13T12:00:00.000Z',
  triggeredBy: { id: 'user-1', firstName: 'Alice', lastName: 'Smith', email: 'alice@example.com' },
};

describe('Agent Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /', () => {
    it('returns the list of registered agents', async () => {
      mockService.listAgents.mockResolvedValue(MOCK_AGENTS);

      const res = await request(createTestApp())
        .get('/api/v1/projects/proj-1/agents')
        .expect(200);

      expect(res.body).toHaveLength(2);
      expect(mockService.listAgents).toHaveBeenCalledWith('proj-1');
    });
  });

  describe('POST /:type/run', () => {
    it('triggers an agent run', async () => {
      mockService.runAgentService.mockResolvedValue({
        runId: 'run-2',
        status: 'PENDING',
      });

      const res = await request(createTestApp())
        .post('/api/v1/projects/proj-1/agents/SUPERVISOR/run')
        .send({ query: 'Check compliance status', runAsync: true })
        .expect(200);

      expect(res.body.runId).toBe('run-2');
      expect(mockService.runAgentService).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: 'proj-1',
          agentType: 'SUPERVISOR',
          input: expect.objectContaining({ query: 'Check compliance status' }),
          runAsync: true,
        })
      );
    });
  });

  describe('GET /runs', () => {
    it('returns agent run history', async () => {
      mockService.listAgentRuns.mockResolvedValue([MOCK_RUN]);

      const res = await request(createTestApp())
        .get('/api/v1/projects/proj-1/agents/runs?agentType=DOCUMENT')
        .expect(200);

      expect(res.body).toHaveLength(1);
      expect(mockService.listAgentRuns).toHaveBeenCalledWith('proj-1', 'DOCUMENT');
    });
  });

  describe('GET /runs/:runId', () => {
    it('returns a single agent run detail', async () => {
      mockService.getAgentRunDetails.mockResolvedValue(MOCK_RUN);

      const res = await request(createTestApp())
        .get('/api/v1/projects/proj-1/agents/runs/run-1')
        .expect(200);

      expect(res.body.id).toBe('run-1');
      expect(mockService.getAgentRunDetails).toHaveBeenCalledWith('run-1');
    });

    it('returns 404 when run is not found', async () => {
      mockService.getAgentRunDetails.mockResolvedValue(null);

      await request(createTestApp())
        .get('/api/v1/projects/proj-1/agents/runs/missing')
        .expect(404);
    });
  });

  describe('PUT /schedule', () => {
    it('updates an agent schedule', async () => {
      mockService.updateAgentScheduleService.mockResolvedValue({
        id: 'sched-1',
        agentType: 'PROJECT_HEALTH',
        schedule: '0 6 * * *',
        isActive: true,
        projectId: 'proj-1',
      });

      const res = await request(createTestApp())
        .put('/api/v1/projects/proj-1/agents/schedule')
        .send({ agentType: 'PROJECT_HEALTH', schedule: '0 6 * * *', isActive: true })
        .expect(200);

      expect(res.body.agentType).toBe('PROJECT_HEALTH');
      expect(mockService.updateAgentScheduleService).toHaveBeenCalledWith({
        projectId: 'proj-1',
        agentType: 'PROJECT_HEALTH',
        schedule: '0 6 * * *',
        isActive: true,
      });
    });
  });
});
