import express from 'express';
import request from 'supertest';
import { Role } from '@prisma/client';
import { complianceRouter } from './routes';

jest.mock('./service', () => ({
  runComplianceCheck: jest.fn(),
  getComplianceSummary: jest.fn(),
}));

const { runComplianceCheck, getComplianceSummary } = jest.requireMock('./service') as {
  runComplianceCheck: jest.Mock;
  getComplianceSummary: jest.Mock;
};

jest.mock('@/modules/auth/middleware', () => ({
  requireAuth: (_req: unknown, _res: unknown, next: () => void) => next(),
  requirePermission: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

jest.mock('@/modules/projects', () => ({
  assertProjectAccess: jest.fn(async () => undefined),
}));

describe('compliance routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function createTestApp() {
    const app = express();
    app.use(express.json());
    app.use('/api/v1/projects/:id/compliance', complianceRouter);
    return app;
  }

  it('runs a compliance check for a project', async () => {
    runComplianceCheck.mockResolvedValue({
      id: 'check-1',
      status: 'COMPLETED',
      complianceScore: 88,
      standards: ['ASHRAE 90.4'],
      findings: [],
      summary: {
        totalFindings: 0,
        compliantFindings: 0,
        warningFindings: 0,
        failedFindings: 0,
      },
      createdAt: '2026-07-12T00:00:00.000Z',
      updatedAt: '2026-07-12T00:00:00.000Z',
    });

    const response = await request(createTestApp())
      .post('/api/v1/projects/project-1/compliance/check')
      .send({ documentIds: ['doc-1'], standards: ['ASHRAE 90.4'] });

    expect(response.status).toBe(200);
    expect(runComplianceCheck).toHaveBeenCalledWith(expect.objectContaining({
      projectId: 'project-1',
      actor: expect.objectContaining({ id: '' }),
    }));
  });

  it('returns a compliance summary for the latest check', async () => {
    getComplianceSummary.mockResolvedValue({
      projectId: 'project-1',
      latestCheck: {
        id: 'check-1',
        complianceScore: 88,
        status: 'COMPLETED',
        createdAt: '2026-07-12T00:00:00.000Z',
      },
      summary: {
        totalFindings: 2,
        compliantFindings: 1,
        warningFindings: 1,
        failedFindings: 0,
        complianceScore: 88,
      },
    });

    const response = await request(createTestApp())
      .get('/api/v1/projects/project-1/compliance/summary');

    expect(response.status).toBe(200);
    expect(response.body.summary).toMatchObject({
      totalFindings: 2,
      complianceScore: 88,
    });
  });
});
