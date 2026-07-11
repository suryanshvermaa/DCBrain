import { Router } from 'express';
import { authRouter } from '@/modules/auth';
import { documentsRouter } from '@/modules/documents';
import { projectsRouter } from '@/modules/projects';
import { searchRouter } from '@/modules/search/routes';

export const routes = Router();

routes.get('/', (_req, res) => {
  res.json({
    message: 'DCBrain API v1',
    endpoints: {
      auth: '/api/v1/auth',
      projects: '/api/v1/projects',
      documents: '/api/v1/projects/{id}/documents',
      search: '/api/v1/projects/{id}/search',
      chat: '/api/v1/projects/{id}/chat',
      compliance: '/api/v1/projects/{id}/compliance',
      schedule: '/api/v1/projects/{id}/schedule',
      procurement: '/api/v1/projects/{id}/procurement',
      agents: '/api/v1/projects/{id}/agents',
      simulation: '/api/v1/projects/{id}/simulations',
      knowledgeGraph: '/api/v1/projects/{id}/graph',
    },
  });
});

routes.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

routes.use('/v1/auth', authRouter);
routes.use('/v1/projects', projectsRouter);
routes.use('/v1/projects/:id/documents', documentsRouter);
routes.use('/v1/projects/:id/search', searchRouter);
