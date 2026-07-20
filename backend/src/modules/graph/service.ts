import { executeRead } from '@/lib/neo4j';
import { logger } from '@/lib/logger';

export interface GraphNode {
  id: string;
  labels: string[];
  properties: Record<string, any>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  properties: Record<string, any>;
}

export interface GraphResult {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export class GraphService {
  /**
   * Clamp a depth value to a safe small integer. Neo4j cannot bind a
   * variable-length range as a parameter, so the value is validated here
   * before being interpolated into the query string.
   */
  private safeDepth(depth: number): number {
    const n = Math.floor(Number(depth));
    if (!Number.isFinite(n)) return 3;
    return Math.min(5, Math.max(1, n));
  }

  /**
   * Retrieves the project-wide dependency graph.
   * Filters out Chunk and Document nodes by default to reduce noise.
   */
  async getProjectDependencies(projectId: string, depth: number = 3, types?: string[]): Promise<GraphResult> {
    const safeDepth = this.safeDepth(depth);
    // Allowlist labels (letters/underscore only) and pass them as a bound param.
    const safeTypes = (types ?? [])
      .map((t) => t.trim())
      .filter((t) => /^[A-Za-z_]+$/.test(t));

    return executeRead(async (tx) => {
      let typeFilter = '';
      if (safeTypes.length > 0) {
        typeFilter = `AND ANY(l IN labels(n) WHERE l IN $types) AND ANY(l IN labels(m) WHERE l IN $types)`;
      } else {
        typeFilter = `AND NOT 'Chunk' IN labels(n) AND NOT 'Chunk' IN labels(m) AND NOT 'Document' IN labels(n) AND NOT 'Document' IN labels(m)`;
      }

      const query = `
        MATCH path = (n)-[*1..${safeDepth}]-(m)
        WHERE (n.projectId = $projectId OR m.projectId = $projectId OR EXISTS((n)<-[:MENTIONS]-(:Chunk)-[:CONTAINS]-(:Document {projectId: $projectId})))
        ${typeFilter}
        WITH nodes(path) AS ns, relationships(path) AS rs
        UNWIND ns AS n
        UNWIND rs AS r
        RETURN collect(DISTINCT n) AS nodes, collect(DISTINCT r) AS edges
      `;

      const result = await tx.run(query, { projectId, types: safeTypes });
      return this.parseGraphResult(result.records[0]);
    });
  }

  /**
   * Retrieves the failure propagation subgraph starting from a specific entity,
   * scoped to entities mentioned within the given project's documents.
   */
  async getFailurePropagation(projectId: string, rootEntityName: string, depth: number = 3): Promise<GraphResult> {
    const safeDepth = this.safeDepth(depth);
    return executeRead(async (tx) => {
      const query = `
        MATCH (root)
        WHERE toLower(root.name) = toLower($rootEntityName)
          AND EXISTS((root)<-[:MENTIONS]-(:Chunk)-[:CONTAINS]-(:Document {projectId: $projectId}))
        MATCH path = (root)-[:DEPENDS_ON*1..${safeDepth}]->(dependent)
        WHERE NOT 'Chunk' IN labels(dependent) AND NOT 'Document' IN labels(dependent)
          AND EXISTS((dependent)<-[:MENTIONS]-(:Chunk)-[:CONTAINS]-(:Document {projectId: $projectId}))
        WITH nodes(path) AS ns, relationships(path) AS rs
        UNWIND ns AS n
        UNWIND rs AS r
        RETURN collect(DISTINCT n) AS nodes, collect(DISTINCT r) AS edges
      `;

      const result = await tx.run(query, { rootEntityName, projectId });
      return this.parseGraphResult(result.records[0]);
    });
  }

  async getEntities(projectId: string, limit: number = 100): Promise<GraphNode[]> {
    return executeRead(async (tx) => {
      const query = `
        MATCH (n)
        WHERE EXISTS((n)<-[:MENTIONS]-(:Chunk)-[:CONTAINS]-(:Document {projectId: $projectId}))
        AND NOT 'Chunk' IN labels(n) AND NOT 'Document' IN labels(n)
        RETURN collect(DISTINCT n) AS nodes
        LIMIT toInteger($limit)
      `;
      const result = await tx.run(query, { projectId, limit });
      const record = result.records[0];
      if (!record) return [];
      return record.get('nodes').map(this.mapNode);
    });
  }

  async getRelatedEntities(projectId: string, entityName: string): Promise<GraphResult> {
    return executeRead(async (tx) => {
      const query = `
        MATCH (root)
        WHERE toLower(root.name) = toLower($entityName)
          AND EXISTS((root)<-[:MENTIONS]-(:Chunk)-[:CONTAINS]-(:Document {projectId: $projectId}))
        MATCH path = (root)-[r]-(related)
        WHERE NOT 'Chunk' IN labels(related) AND NOT 'Document' IN labels(related)
          AND EXISTS((related)<-[:MENTIONS]-(:Chunk)-[:CONTAINS]-(:Document {projectId: $projectId}))
        WITH nodes(path) AS ns, relationships(path) AS rs
        UNWIND ns AS n
        UNWIND rs AS r
        RETURN collect(DISTINCT n) AS nodes, collect(DISTINCT r) AS edges
      `;

      const result = await tx.run(query, { entityName, projectId });
      return this.parseGraphResult(result.records[0]);
    });
  }

  private parseGraphResult(record: any): GraphResult {
    if (!record) return { nodes: [], edges: [] };
    
    const neo4jNodes = record.get('nodes') || [];
    const neo4jEdges = record.get('edges') || [];

    const nodes = neo4jNodes.map(this.mapNode);
    const edges = neo4jEdges.map(this.mapEdge);

    return { nodes, edges };
  }

  private mapNode(n: any): GraphNode {
    return {
      id: n.elementId,
      labels: n.labels,
      properties: n.properties,
    };
  }

  private mapEdge(e: any): GraphEdge {
    return {
      id: e.elementId,
      source: e.startNodeElementId,
      target: e.endNodeElementId,
      type: e.type,
      properties: e.properties,
    };
  }
}

export const graphService = new GraphService();
