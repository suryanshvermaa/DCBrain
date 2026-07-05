import { Router } from 'express';
import { authRouter } from '@/modules/auth';

export const routes = Router();

routes.get('/', (_req, res) => {
  res.json({
    message: 'DCBrain API v1',
    endpoints: {
      auth: '/api/v1/auth',
      documents: '/api/documents',
      search: '/api/search',
      chat: '/api/chat',
      compliance: '/api/compliance',
      schedule: '/api/schedule',
      procurement: '/api/procurement',
      dashboard: '/api/dashboard',
      agents: '/api/agents',
      simulation: '/api/simulation',
      knowledgeGraph: '/api/knowledge-graph',
    },
  });
});

routes.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

routes.use('/v1/auth', authRouter);
