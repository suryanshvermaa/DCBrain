import express from 'express';
import request from 'supertest';
import simulationsRouter from './routes';

jest.mock('./service', () => ({
  createAndRunSimulation: jest.fn(),
  listSimulations: jest.fn(),
  getSimulation: jest.fn(),
  generateMitigationPlan: jest.fn(),
}));

const { createAndRunSimulation, listSimulations } = jest.requireMock('./service') as {
  createAndRunSimulation: jest.Mock;
  listSimulations: jest.Mock;
};

jest.mock('@/modules/auth/middleware', () => ({
  requireAuth: (req: any, _res: any, next: () => void) => {
    req.auth = { user: { id: 'test-user-id', role: 'ENGINEER' } };
    next();
  },
  requirePermission: () => (_req: any, _res: any, next: () => void) => next(),
}));

jest.mock('@/modules/projects', () => ({
  assertProjectAccess: jest.fn(async () => undefined),
}));

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/v1/projects/:id/simulations', simulationsRouter);
  return app;
}

describe('Simulations API Routes', () => {
  const app = createTestApp();
  const projectId = 'test-project-id';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('POST /api/v1/projects/:projectId/simulations/delay should run simulation', async () => {
    createAndRunSimulation.mockResolvedValue({
      id: 'sim-1',
      name: 'Test Simulation',
      status: 'COMPLETED',
      costImpact: 70000,
    });

    const res = await request(app)
      .post(`/api/v1/projects/${projectId}/simulations/delay`)
      .set('Authorization', 'Bearer mock-token')
      .send({
        name: 'Test Simulation',
        targetActivityId: 'ACT-100',
        delayDays: 14,
        assumptions: { costPerDay: 5000 },
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBe('sim-1');
    expect(createAndRunSimulation).toHaveBeenCalled();
  });

  it('GET /api/v1/projects/:projectId/simulations should list simulations', async () => {
    listSimulations.mockResolvedValue([
      { id: 'sim-1', name: 'Test Simulation', status: 'COMPLETED' },
    ]);

    const res = await request(app)
      .get(`/api/v1/projects/${projectId}/simulations`)
      .set('Authorization', 'Bearer mock-token');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
  });
});
