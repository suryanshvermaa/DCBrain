import request from 'supertest';
import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { getTestToken, createTestUser, createTestProject } from '@/lib/test-utils';
import { graphService } from '@/modules/graph/service';
import { runAgentService } from '@/modules/agents/service';

jest.mock('@/modules/graph/service', () => ({
  graphService: {
    getFailurePropagation: jest.fn(),
  },
}));

jest.mock('@/modules/agents/service', () => ({
  runAgentService: jest.fn(),
}));

describe('Simulations API', () => {
  let token: string;
  let projectId: string;
  let userId: string;
  let activityId: string;

  beforeAll(async () => {
    const user = await createTestUser({ role: 'ENGINEER' });
    userId = user.id;
    token = getTestToken(user);
    
    const project = await createTestProject(user.id);
    projectId = project.id;
    
    const importRecord = await prisma.scheduleImport.create({
      data: {
        projectId,
        filename: 'test.xml',
        status: 'SUCCESS',
        activityCount: 1,
      },
    });

    const activity = await prisma.scheduleActivity.create({
      data: {
        projectId,
        importId: importRecord.id,
        activityId: 'ACT-100',
        name: 'Test Activity',
      },
    });
    activityId = activity.activityId;
  });

  afterAll(async () => {
    await prisma.simulation.deleteMany();
    await prisma.scheduleActivity.deleteMany();
    await prisma.scheduleImport.deleteMany();
    await prisma.project.deleteMany();
    await prisma.user.deleteMany();
  });

  it('POST /api/v1/projects/:projectId/simulations/delay should run simulation', async () => {
    (graphService.getFailurePropagation as jest.Mock).mockResolvedValue({
      nodes: [
        { properties: { name: 'Test Activity' }, labels: ['Activity'] },
        { properties: { name: 'Downstream 1' }, labels: ['Equipment'] }
      ],
      edges: []
    });

    const res = await request(app)
      .post(`/api/v1/projects/${projectId}/simulations/delay`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Test Simulation',
        targetActivityId: activityId,
        delayDays: 14,
        assumptions: { costPerDay: 5000 },
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();

    const sim = await prisma.simulation.findUnique({ where: { id: res.body.id } });
    expect(sim?.status).toBe('COMPLETED');
    expect(sim?.costImpact).toBe(70000); // 1 downstream node * 14 days * 5000
  });

  it('GET /api/v1/projects/:projectId/simulations should list simulations', async () => {
    const res = await request(app)
      .get(`/api/v1/projects/${projectId}/simulations`)
      .set('Authorization', `Bearer ${token}`);
      
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });
});
