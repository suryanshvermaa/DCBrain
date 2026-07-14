import express from 'express';
import request from 'supertest';
import { rfisRouter } from './routes';
import { RfiStatus, RfiPriority } from '@prisma/client';

jest.mock('./service', () => ({
  createRfi: jest.fn(),
  listRfis: jest.fn(),
  getRfi: jest.fn(),
  updateRfi: jest.fn(),
  suggestRfiAnswer: jest.fn(),
  getRfiAnalytics: jest.fn(),
}));

const mockService = jest.requireMock('./service') as {
  createRfi: jest.Mock;
  listRfis: jest.Mock;
  getRfi: jest.Mock;
  updateRfi: jest.Mock;
  suggestRfiAnswer: jest.Mock;
  getRfiAnalytics: jest.Mock;
};

jest.mock('@/modules/auth/middleware', () => ({
  requireAuth: (_req: unknown, _res: unknown, next: () => void) => next(),
  requirePermission: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

jest.mock('@/modules/projects', () => ({
  assertProjectAccess: jest.fn(() => Promise.resolve(undefined)),
}));

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/v1/projects/:id/rfis', rfisRouter);
  return app;
}

const MOCK_RFI_RESPONSE = {
  id: 'rfi-1',
  number: 'RFI-0001',
  subject: 'Test RFI',
  question: 'What is the temperature limit?',
  status: RfiStatus.OPEN,
  priority: RfiPriority.MEDIUM,
  discipline: 'Mechanical',
  dueDate: '2026-07-20T00:00:00.000Z',
  resolution: null,
  suggestedAnswer: null,
  suggestedSources: [],
  suggestedAt: null,
  answeredAt: null,
  closedAt: null,
  ageDays: 0,
  overdue: false,
  raisedBy: { id: 'user-1', name: 'Alice Smith' },
  assignee: { id: 'user-2', name: 'Bob Jones' },
  answeredBy: null,
  documents: [],
  createdAt: '2026-07-13T12:00:00.000Z',
  updatedAt: '2026-07-13T12:00:00.000Z',
};

const MOCK_ANALYTICS = {
  total: 5,
  byStatus: { OPEN: 2, IN_REVIEW: 1, ANSWERED: 1, CLOSED: 1, VOID: 0 },
  open: 3,
  overdue: 1,
  avgResolutionDays: 4.5,
  ageingBuckets: { '0-7': 2, '8-14': 1, '15-30': 0, '30+': 0 },
};

describe('RFI Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /', () => {
    it('returns a list of RFIs', async () => {
      mockService.listRfis.mockResolvedValue({
        total: 1,
        rfis: [MOCK_RFI_RESPONSE],
      });

      const res = await request(createTestApp())
        .get('/api/v1/projects/proj-1/rfis')
        .query({ status: 'OPEN' });

      const body = res.body as { total: number; rfis: Array<{ number: string }> };
      expect(res.status).toBe(200);
      expect(body.total).toBe(1);
      expect(body.rfis[0]!.number).toBe('RFI-0001');
      expect(mockService.listRfis).toHaveBeenCalledWith(
        expect.objectContaining({ projectId: 'proj-1', status: 'OPEN' })
      );
    });
  });

  describe('POST /', () => {
    it('creates a new RFI', async () => {
      mockService.createRfi.mockResolvedValue(MOCK_RFI_RESPONSE);

      const res = await request(createTestApp()).post('/api/v1/projects/proj-1/rfis').send({
        subject: 'Test RFI',
        question: 'What is the temperature limit?',
        priority: 'MEDIUM',
      });

      const body = res.body as { id: string };
      expect(res.status).toBe(201);
      expect(body.id).toBe('rfi-1');
      expect(mockService.createRfi).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: 'proj-1',
          data: expect.objectContaining({ subject: 'Test RFI' }) as unknown,
        })
      );
    });
  });

  describe('GET /analytics', () => {
    it('returns RFI analytics', async () => {
      mockService.getRfiAnalytics.mockResolvedValue(MOCK_ANALYTICS);

      const res = await request(createTestApp()).get('/api/v1/projects/proj-1/rfis/analytics');

      const body = res.body as { total: number; open: number };
      expect(res.status).toBe(200);
      expect(body.total).toBe(5);
      expect(body.open).toBe(3);
      expect(mockService.getRfiAnalytics).toHaveBeenCalledWith(
        expect.objectContaining({ projectId: 'proj-1' })
      );
    });
  });

  describe('GET /:rfiId', () => {
    it('returns RFI details', async () => {
      mockService.getRfi.mockResolvedValue(MOCK_RFI_RESPONSE);

      const res = await request(createTestApp()).get('/api/v1/projects/proj-1/rfis/rfi-1');

      const body = res.body as { id: string };
      expect(res.status).toBe(200);
      expect(body.id).toBe('rfi-1');
      expect(mockService.getRfi).toHaveBeenCalledWith(
        expect.objectContaining({ projectId: 'proj-1', rfiId: 'rfi-1' })
      );
    });
  });

  describe('PUT /:rfiId', () => {
    it('updates RFI parameters', async () => {
      mockService.updateRfi.mockResolvedValue(MOCK_RFI_RESPONSE);

      const res = await request(createTestApp())
        .put('/api/v1/projects/proj-1/rfis/rfi-1')
        .send({ status: 'IN_REVIEW' });

      expect(res.status).toBe(200);
      expect(mockService.updateRfi).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: 'proj-1',
          rfiId: 'rfi-1',
          data: { status: 'IN_REVIEW' },
        })
      );
    });
  });

  describe('POST /:rfiId/suggest-answer', () => {
    it('triggers RAG response suggestion', async () => {
      mockService.suggestRfiAnswer.mockResolvedValue(MOCK_RFI_RESPONSE);

      const res = await request(createTestApp())
        .post('/api/v1/projects/proj-1/rfis/rfi-1/suggest-answer')
        .send({});

      expect(res.status).toBe(200);
      expect(mockService.suggestRfiAnswer).toHaveBeenCalledWith(
        expect.objectContaining({ projectId: 'proj-1', rfiId: 'rfi-1' })
      );
    });
  });
});
