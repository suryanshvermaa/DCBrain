import express from 'express';
import request from 'supertest';
import { dashboardRouter } from './routes';

jest.mock('./service', () => ({
  getDashboardSummary: jest.fn(),
}));

const { getDashboardSummary } = jest.requireMock('./service') as {
  getDashboardSummary: jest.Mock;
};

jest.mock('@/modules/auth/middleware', () => ({
  requireAuth: (_req: unknown, _res: unknown, next: () => void) => next(),
  requirePermission: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

jest.mock('@/modules/projects', () => ({
  assertProjectAccess: jest.fn(async () => undefined),
}));

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/v1/projects/:id/dashboard', dashboardRouter);
  return app;
}

const MOCK_SUMMARY = {
  projectId: 'project-1',
  healthScore: 82,
  documents: {
    total: 10,
    processed: 8,
    queued: 1,
    failed: 1,
    byCategory: { specification: 5, drawing: 3, report: 2 },
  },
  compliance: {
    score: 90,
    totalFindings: 2,
    criticalFindings: 0,
    warningFindings: 2,
    lastCheckedAt: '2026-07-13T07:00:00.000Z',
  },
  schedule: {
    totalActivities: 45,
    highRiskCount: 3,
    criticalPathCount: 12,
    spi: 0.95,
    overallRiskScore: 28,
    lastImportedAt: '2026-07-13T06:00:00.000Z',
  },
  recentActivity: [
    {
      id: 'act-1',
      type: 'DOCUMENT_UPLOAD',
      title: 'Uploaded specification.pdf',
      description: null,
      createdAt: '2026-07-13T07:00:00.000Z',
      userName: 'Alice Smith',
    },
  ],
  generatedAt: '2026-07-13T07:10:00.000Z',
};

describe('dashboard routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET /summary returns dashboard data', async () => {
    getDashboardSummary.mockResolvedValue(MOCK_SUMMARY);

    const response = await request(createTestApp()).get(
      '/api/v1/projects/project-1/dashboard/summary',
    );

    expect(response.status).toBe(200);
    expect(response.body.healthScore).toBe(82);
    expect(response.body.documents.total).toBe(10);
    expect(response.body.compliance.score).toBe(90);
    expect(response.body.schedule.spi).toBe(0.95);
    expect(response.body.recentActivity).toHaveLength(1);
    expect(getDashboardSummary).toHaveBeenCalledWith(
      expect.objectContaining({ projectId: 'project-1', forceRefresh: false }),
    );
  });

  it('GET /summary?refresh=true forces cache bypass', async () => {
    getDashboardSummary.mockResolvedValue(MOCK_SUMMARY);

    const response = await request(createTestApp()).get(
      '/api/v1/projects/project-1/dashboard/summary?refresh=true',
    );

    expect(response.status).toBe(200);
    expect(getDashboardSummary).toHaveBeenCalledWith(
      expect.objectContaining({ forceRefresh: true }),
    );
  });

  it('GET /summary returns 500 when service throws', async () => {
    getDashboardSummary.mockRejectedValue(new Error('DB connection failed'));

    const response = await request(createTestApp()).get(
      '/api/v1/projects/project-1/dashboard/summary',
    );

    expect(response.status).toBe(500);
  });
});
