import express from 'express';
import request from 'supertest';
import { scheduleRouter } from './routes';

jest.mock('./service', () => ({
  importSchedule: jest.fn(),
  getScheduleActivities: jest.fn(),
  getScheduleRiskSummary: jest.fn(),
  listScheduleImports: jest.fn(),
}));

const {
  getScheduleRiskSummary,
  getScheduleActivities,
  listScheduleImports,
} = jest.requireMock('./service') as {
  getScheduleRiskSummary: jest.Mock;
  getScheduleActivities: jest.Mock;
  listScheduleImports: jest.Mock;
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
  app.use('/api/v1/projects/:id/schedule', scheduleRouter);
  return app;
}

describe('schedule routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET /summary returns empty summary when no import exists', async () => {
    getScheduleRiskSummary.mockResolvedValue({
      projectId: 'project-1',
      latestImport: null,
      health: {
        totalActivities: 0,
        criticalPathCount: 0,
        highRiskCount: 0,
        spi: 1.0,
        floatConsumptionRate: 0,
        predictedCompletionDate: null,
        overallRiskScore: 0,
      },
      riskDistribution: { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 },
    });

    const response = await request(createTestApp())
      .get('/api/v1/projects/project-1/schedule/summary');

    expect(response.status).toBe(200);
    expect(response.body.latestImport).toBeNull();
    expect(response.body.health.totalActivities).toBe(0);
    expect(getScheduleRiskSummary).toHaveBeenCalledWith(
      expect.objectContaining({ projectId: 'project-1' })
    );
  });

  it('GET /activities returns activities list', async () => {
    getScheduleActivities.mockResolvedValue({
      activities: [
        {
          id: 'act-1',
          activityId: 'A1010',
          name: 'Site Preparation',
          wbsCode: '1.1',
          wbsName: null,
          plannedStart: '2026-01-01T00:00:00.000Z',
          plannedFinish: '2026-01-20T00:00:00.000Z',
          actualStart: null,
          actualFinish: null,
          durationDays: 19,
          totalFloat: 0,
          freeFloat: 0,
          isCritical: true,
          riskScore: 85,
          riskLevel: 'CRITICAL',
          predecessors: [],
          mitigationActions: ['Fast-track sub-activities.'],
        },
      ],
      total: 1,
    });

    const response = await request(createTestApp())
      .get('/api/v1/projects/project-1/schedule/activities');

    expect(response.status).toBe(200);
    expect(response.body.total).toBe(1);
    expect(response.body.activities[0].riskLevel).toBe('CRITICAL');
  });

  it('GET /imports returns import history', async () => {
    listScheduleImports.mockResolvedValue([
      {
        id: 'imp-1',
        filename: 'schedule.xml',
        activityCount: 42,
        status: 'SUCCESS',
        errorMessage: null,
        importedAt: '2026-07-13T00:00:00.000Z',
      },
    ]);

    const response = await request(createTestApp())
      .get('/api/v1/projects/project-1/schedule/imports');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].filename).toBe('schedule.xml');
  });
});
