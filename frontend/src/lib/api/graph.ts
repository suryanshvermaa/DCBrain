import { getApiClient } from '@/lib/api';

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

const api = getApiClient();

export const graphApi = {
  async getDependencies(projectId: string, depth: number = 3, types?: string[]): Promise<GraphResult> {
    const params = new URLSearchParams({ depth: depth.toString() });
    if (types && types.length > 0) {
      params.append('types', types.join(','));
    }

    return api.get<GraphResult>(
      `/api/v1/projects/${projectId}/graph/dependencies?${params.toString()}`,
    );
  },

  async getFailurePropagation(projectId: string, rootEntityName: string, depth: number = 3): Promise<GraphResult> {
    const params = new URLSearchParams({ root: rootEntityName, depth: depth.toString() });

    return api.get<GraphResult>(
      `/api/v1/projects/${projectId}/graph/failures?${params.toString()}`,
    );
  },

  async getEntities(projectId: string, limit: number = 100): Promise<GraphNode[]> {
    const json = await api.get<{ data: GraphNode[] }>(
      `/api/v1/projects/${projectId}/graph/entities?limit=${limit}`,
    );
    return json.data;
  },
};
