import request from 'supertest';
import { createApp } from '@/app';
import { sign } from 'jsonwebtoken';
import config from '@/core/config';
import { checkNeo4jHealth, closeNeo4j, executeWrite } from '@/lib/neo4j';

const app = createApp();

function generateTestToken(userId: string = 'test-user') {
  return sign({ id: userId, email: 'test@example.com' }, config.JWT_SECRET_KEY, { expiresIn: '1h' });
}

describe('Graph API Routes', () => {
  const token = generateTestToken();
  const projectId = 'test-project-123';
  let neo4jAvailable = false;

  beforeAll(async () => {
    neo4jAvailable = await checkNeo4jHealth();
    if (!neo4jAvailable) {
      console.warn('Neo4j is not reachable — skipping Graph API integration tests');
      return;
    }

    await executeWrite(async (tx) => {
      await tx.run(
        `MERGE (d:Document {id: 'doc-1', projectId: $projectId})
         MERGE (c:Chunk {id: 'chunk-1'})
         MERGE (d)-[:CONTAINS]->(c)
         MERGE (e1:Equipment {name: 'GENERATOR-X'})
         MERGE (v1:Vendor {name: 'VENDOR-A'})
         MERGE (c)-[:MENTIONS]->(e1)
         MERGE (c)-[:MENTIONS]->(v1)
         MERGE (v1)-[:SUPPLIES]->(e1)`,
        { projectId }
      );
    });
  }, 30000);

  afterAll(async () => {
    if (!neo4jAvailable) return;

    await executeWrite(async (tx) => {
      await tx.run(
        `MATCH (n) WHERE n.projectId = $projectId OR EXISTS((n)<-[:MENTIONS]-(:Chunk)-[:CONTAINS]-(:Document {projectId: $projectId})) DETACH DELETE n`,
        { projectId }
      );
    });
    await closeNeo4j();
  }, 30000);

  it('should fetch project dependencies', async () => {
    if (!neo4jAvailable) return;

    const res = await request(app)
      .get(`/api/v1/projects/${projectId}/graph/dependencies`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.nodes).toBeDefined();
    expect(res.body.edges).toBeDefined();
    expect(res.body.nodes.length).toBeGreaterThanOrEqual(2);
  });

  it('should fetch failure propagation graph', async () => {
    if (!neo4jAvailable) return;

    const res = await request(app)
      .get(`/api/v1/projects/${projectId}/graph/failures?root=VENDOR-A`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.nodes).toBeDefined();
    const names = res.body.nodes.map((n: { properties: { name: string } }) => n.properties.name);
    expect(names).toContain('VENDOR-A');
    expect(names).toContain('GENERATOR-X');
  });

  it('should fetch all entities', async () => {
    if (!neo4jAvailable) return;

    const res = await request(app)
      .get(`/api/v1/projects/${projectId}/graph/entities`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.data).toBeDefined();
    expect(res.body.data.length).toBeGreaterThanOrEqual(2);
  });
});
