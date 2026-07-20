"use client";

import React, { useCallback, useEffect, useState } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  Panel,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { graphApi, GraphNode, GraphEdge } from '@/lib/api/graph';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import * as projectsApi from '@/lib/api/projects';
import { Network, AlertTriangle, Layers, Maximize, Loader2, ChevronDown, ChevronRight, Info } from 'lucide-react';

/* ─── Color Maps ─── */

const nodeColors: Record<string, string> = {
  Equipment: '#3b82f6',
  Vendor: '#8b5cf6',
  Standard: '#10b981',
  Activity: '#f59e0b',
  DocumentReference: '#64748b',
};

const edgeColors: Record<string, string> = {
  SUPPLIES: '#a78bfa',      // violet
  DEPENDS_ON: '#f87171',    // red
  GOVERNS: '#34d399',       // green
  REFERENCES: '#fbbf24',    // yellow
  MENTIONS: '#94a3b8',      // slate
};

const nodeLabels: Record<string, string> = {
  Equipment: 'Equipment',
  Vendor: 'Vendor',
  Standard: 'Standard',
  Activity: 'Activity',
  DocumentReference: 'Document Ref',
};

const edgeLabels: Record<string, string> = {
  SUPPLIES: 'Supplies',
  DEPENDS_ON: 'Depends On',
  GOVERNS: 'Governs',
  REFERENCES: 'References',
  MENTIONS: 'Mentions',
};

/* ─── Layout helper: group by type into rows ─── */

function layoutNodes(nodes: GraphNode[]): Record<string, { x: number; y: number }> {
  const groups: Record<string, GraphNode[]> = {};
  for (const n of nodes) {
    const label = n.labels[0] || 'Unknown';
    if (!groups[label]) groups[label] = [];
    groups[label].push(n);
  }

  const typeOrder = ['Vendor', 'Equipment', 'Standard', 'Activity', 'DocumentReference'];
  const sortedTypes = typeOrder.filter(t => groups[t]).concat(
    Object.keys(groups).filter(t => !typeOrder.includes(t))
  );

  const positions: Record<string, { x: number; y: number }> = {};
  const nodeSpacingX = 260;
  const rowSpacingY = 180;

  sortedTypes.forEach((type, rowIdx) => {
    const group = groups[type];
    const totalWidth = group.length * nodeSpacingX;
    const startX = -totalWidth / 2 + nodeSpacingX / 2;

    group.forEach((n, colIdx) => {
      positions[n.id] = {
        x: startX + colIdx * nodeSpacingX,
        y: rowIdx * rowSpacingY,
      };
    });
  });

  return positions;
}

/* ─── Main Component ─── */

function GraphPageContent() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [projects, setProjects] = useState<projectsApi.Project[]>([]);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'dependencies' | 'failures'>('dependencies');
  const [failureRoot, setFailureRoot] = useState('');
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [legendOpen, setLegendOpen] = useState(false);

  useEffect(() => {
    async function loadProjects() {
      try {
        const result = await projectsApi.listProjects();
        setProjects(result.projects);
        setProjectId((current) => current ?? result.projects[0]?.id ?? null);
      } catch {
        setError('Failed to load projects.');
      }
    }
    void loadProjects();
  }, []);

  const fetchGraph = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      setError(null);
      let data;
      if (mode === 'dependencies') {
        data = await graphApi.getDependencies(projectId, 3);
      } else if (mode === 'failures' && failureRoot) {
        data = await graphApi.getFailurePropagation(projectId, failureRoot, 3);
      } else {
        return;
      }

      if (!data.nodes || data.nodes.length === 0) {
        setNodes([]);
        setEdges([]);
        setError('No graph data found. Upload and process documents to populate the Knowledge Graph.');
        return;
      }

      const positions = layoutNodes(data.nodes);

      const rfNodes = data.nodes.map((n: GraphNode) => {
        const primaryLabel = n.labels[0] || 'Unknown';
        const pos = positions[n.id] || { x: 0, y: 0 };
        return {
          id: n.id,
          position: pos,
          data: {
            label: n.properties.name || primaryLabel,
            ...n,
          },
          style: {
            background: nodeColors[primaryLabel] || '#64748b',
            color: '#fff',
            border: '2px solid rgba(255,255,255,0.15)',
            borderRadius: '10px',
            padding: '8px 16px',
            fontWeight: 600,
            fontSize: '12px',
            boxShadow: `0 2px 12px ${nodeColors[primaryLabel] || '#64748b'}44`,
            minWidth: '100px',
            textAlign: 'center' as const,
          },
        };
      });

      const rfEdges = data.edges.map((e: GraphEdge) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        animated: mode === 'failures',
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: mode === 'failures' ? '#ef4444' : (edgeColors[e.type] || '#9ca3af'),
        },
        style: {
          stroke: mode === 'failures' ? '#ef4444' : (edgeColors[e.type] || '#9ca3af'),
          strokeWidth: 2,
        },
      }));

      setNodes(rfNodes);
      setEdges(rfEdges);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch graph data. Make sure Neo4j is running.');
    } finally {
      setLoading(false);
    }
  }, [projectId, mode, failureRoot, setNodes, setEdges]);

  useEffect(() => {
    if (projectId && mode === 'dependencies') {
      fetchGraph();
    }
  }, [projectId, mode, fetchGraph]);

  const onNodeClick = (_: React.MouseEvent, node: any) => {
    setSelectedNode(node.data as GraphNode);
  };

  return (
    <AppShell title="Knowledge Graph" subtitle="Explore entity dependencies and simulate failure propagation">
      <div className="flex flex-col md:flex-row" style={{ height: 'calc(100vh - 73px)' }}>
      <div className="flex-1 relative bg-[var(--color-bg)]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          minZoom={0.2}
          maxZoom={2}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="var(--color-divider)" gap={20} size={1} />
          <Controls className="!bg-[var(--color-surface)] !border-[var(--color-border)] !shadow-lg [&>button]:!bg-[var(--color-surface-raised)] [&>button]:!border-[var(--color-input)] [&>button]:!text-[var(--color-text-primary)] [&>button:hover]:!bg-[var(--color-surface-hover)]" />
          <MiniMap
            nodeColor={(n: any) => n.style?.background as string || '#64748b'}
            maskColor="rgba(0, 0, 0, 0.3)"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px' }}
          />

          {!loading && nodes.length === 0 && (
            <Panel position="top-center" className="mt-24 max-w-md w-full mx-4">
              <div className="bg-[var(--color-surface)] p-6 rounded-xl border border-[var(--color-border)] shadow-xl text-center space-y-3">
                <Network className="w-10 h-10 text-[var(--color-text-tertiary)] mx-auto" />
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Knowledge Graph is Empty</h3>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  No entities or relationships found in Neo4j. Upload and process project documents (specifications, P6 schedules, equipment lists) to automatically extract entities and populate the graph.
                </p>
                <div className="pt-2">
                  <a
                    href={`/documents${projectId ? `?projectId=${projectId}` : ''}`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] text-[var(--color-primary-foreground)] rounded-lg text-sm font-medium hover:bg-[var(--color-primary-hover)] transition-colors"
                  >
                    Go to Documents
                  </a>
                </div>
              </div>
            </Panel>
          )}

          {/* ── Top-left Controls ── */}
          <Panel position="top-left" className="space-y-3 max-w-xs">
            {/* Title + Project */}
            <div className="bg-[var(--color-surface)] backdrop-blur-sm p-4 rounded-xl shadow-lg border border-[var(--color-border)] space-y-3">
              <div>
                <h2 className="text-base font-bold flex items-center gap-2 text-[var(--color-text-primary)]">
                  <Network className="w-4 h-4 text-[var(--color-primary)]" /> Knowledge Graph
                </h2>
              </div>

              <div>
                <select
                  className="w-full h-8 text-xs px-2 border border-[var(--color-input)] rounded-lg bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={projectId ?? ''}
                  onChange={(e) => setProjectId(e.target.value)}
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-1.5">
                <button
                  className={`flex-1 inline-flex items-center justify-center px-2 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    mode === 'dependencies'
                      ? 'bg-[var(--color-primary)] text-[var(--color-text-primary)] shadow-md shadow-[var(--color-focus-ring)]'
                      : 'bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-colors'
                  }`}
                  onClick={() => setMode('dependencies')}
                >
                  <Layers className="w-3.5 h-3.5 mr-1.5" />
                  Dependencies
                </button>
                <button
                  className={`flex-1 inline-flex items-center justify-center px-2 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    mode === 'failures'
                      ? 'bg-red-600 text-[var(--color-text-primary)] shadow-md shadow-red-600/30'
                      : 'bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-colors'
                  }`}
                  onClick={() => setMode('failures')}
                >
                  <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />
                  Failures
                </button>
              </div>

              {mode === 'failures' && (
                <div className="flex gap-1.5 items-center">
                  <input
                    placeholder="Root entity name..."
                    value={failureRoot}
                    onChange={(e) => setFailureRoot(e.target.value)}
                    className="h-7 text-xs flex-1 px-2 border border-[var(--color-input)] rounded-lg bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <button
                    className="inline-flex items-center px-3 h-7 text-xs font-medium rounded-lg bg-red-600 text-[var(--color-text-primary)] hover:bg-red-700 disabled:opacity-40 transition-colors"
                    onClick={fetchGraph}
                    disabled={!failureRoot || loading}
                  >
                    {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Trace'}
                  </button>
                </div>
              )}

              {error && (
                <div className="text-xs text-amber-400 bg-amber-950/50 border border-amber-800/50 rounded-lg p-2">
                  {error}
                </div>
              )}

              {loading && (
                <div className="flex items-center gap-2 text-xs text-[var(--color-text-tertiary)]">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading graph...
                </div>
              )}
            </div>

            {/* ── Collapsible Legend ── */}
            <div className="bg-[var(--color-surface)] backdrop-blur-sm rounded-xl shadow-lg border border-[var(--color-border)] overflow-hidden">
              <button
                onClick={() => setLegendOpen(!legendOpen)}
                className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)]/50 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Info className="w-3.5 h-3.5 text-[var(--color-text-tertiary)]" /> Legend
                </span>
                {legendOpen
                  ? <ChevronDown className="w-3.5 h-3.5 text-[var(--color-text-tertiary)]" />
                  : <ChevronRight className="w-3.5 h-3.5 text-[var(--color-text-tertiary)]" />
                }
              </button>

              {legendOpen && (
                <div className="px-4 pb-3 space-y-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)] font-semibold mb-1.5">Nodes</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {Object.entries(nodeColors).map(([type, color]) => (
                        <div key={type} className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: color }} />
                          <span className="text-[11px] text-[var(--color-text-secondary)]">{nodeLabels[type] || type}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="border-t border-[var(--color-border)] pt-2">
                    <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)] font-semibold mb-1.5">Edges</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {Object.entries(edgeColors).map(([type, color]) => (
                        <div key={type} className="flex items-center gap-2">
                          <span className="w-4 h-0.5 flex-shrink-0 rounded-full" style={{ background: color }} />
                          <span className="text-[11px] text-[var(--color-text-secondary)]">{edgeLabels[type] || type}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Panel>
        </ReactFlow>
      </div>

      {/* ── Node Inspector Sidebar ── */}
      <div className="w-full md:w-72 p-5 overflow-y-auto bg-[var(--color-surface)] border-l border-[var(--color-divider)]">
        <h3 className="font-semibold text-sm mb-4 flex items-center gap-2 text-[var(--color-text-secondary)] uppercase tracking-wider">
          <Maximize className="w-4 h-4 text-[var(--color-text-tertiary)]" />
          Node Inspector
        </h3>
        {selectedNode ? (
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] shadow-lg overflow-hidden">
            <div className="p-4 border-b border-[var(--color-divider)]" style={{ borderTop: `3px solid ${nodeColors[selectedNode.labels[0]] || '#64748b'}` }}>
              <h4 className="text-sm font-bold text-[var(--color-text-primary)]">
                {selectedNode.properties.name || 'Unnamed Node'}
              </h4>
              <div className="mt-2 flex flex-wrap gap-1">
                {selectedNode.labels.map(l => (
                  <span
                    key={l}
                    className="inline-block px-2 py-0.5 text-[10px] font-medium rounded-full text-[var(--color-text-primary)]/90"
                    style={{ background: `${nodeColors[l] || '#64748b'}cc` }}
                  >
                    {l}
                  </span>
                ))}
              </div>
            </div>
            <div className="p-4">
              <div className="space-y-2">
                {Object.entries(selectedNode.properties).map(([key, value]) => {
                  if (key === 'name' || key === 'projectId') return null;
                  return (
                    <div key={key} className="flex justify-between text-xs">
                      <span className="font-medium text-[var(--color-text-secondary)] capitalize">{key}</span>
                      <span className="text-[var(--color-text-primary)] text-right ml-2 break-words">{String(value)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-xs text-[var(--color-text-secondary)] p-4 border border-dashed border-[var(--color-border)] rounded-xl text-center">
            Click on a node in the graph to inspect its properties.
          </div>
        )}
      </div>
    </div>
    </AppShell>
  );
}

export default function GraphPage() {
  return (
    <ProtectedRoute>
      <GraphPageContent />
    </ProtectedRoute>
  );
}
