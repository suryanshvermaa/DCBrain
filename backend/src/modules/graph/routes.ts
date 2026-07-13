import { Router } from 'express';
import { requireAuth } from '@/modules/auth/middleware';
import { graphService } from './service';
import { GraphQuerySchema } from './schemas';
import { logger } from '@/lib/logger';

export const graphRouter = Router({ mergeParams: true });

graphRouter.use(requireAuth);

graphRouter.get('/dependencies', async (req, res) => {
  try {
    const params = req.params as Record<string, string>;
    const projectId = params['id'];
    const query = GraphQuerySchema.parse(req.query);
    const typesArray = query.types ? query.types.split(',').map(t => t.trim()) : undefined;
    
    const result = await graphService.getProjectDependencies(projectId as string, query.depth, typesArray);
    res.json(result);
  } catch (error) {
    logger.error('Failed to get graph dependencies', { error });
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

graphRouter.get('/failures', async (req, res) => {
  try {
    const params = req.params as Record<string, string>;
    const projectId = params['id'];
    const root = req.query['root'] as string;
    if (!root || typeof root !== 'string') {
      return res.status(400).json({ error: 'root entity name is required in query params' });
    }
    const query = GraphQuerySchema.parse(req.query);
    
    const result = await graphService.getFailurePropagation(projectId as string, root, query.depth);
    res.json(result);
  } catch (error) {
    logger.error('Failed to get failure propagation graph', { error });
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

graphRouter.get('/entities', async (req, res) => {
  try {
    const params = req.params as Record<string, string>;
    const projectId = params['id'];
    const limitParam = req.query['limit'] as string | undefined;
    const limit = limitParam ? parseInt(limitParam, 10) : 100;
    
    const result = await graphService.getEntities(projectId as string, limit);
    res.json({ data: result });
  } catch (error) {
    logger.error('Failed to get graph entities', { error });
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

graphRouter.get('/entities/:entityName/related', async (req, res) => {
  try {
    const params = req.params as Record<string, string>;
    const projectId = params['id'];
    const entityName = params['entityName'];
    
    const result = await graphService.getRelatedEntities(projectId as string, entityName as string);
    res.json(result);
  } catch (error) {
    logger.error('Failed to get related entities', { error });
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
