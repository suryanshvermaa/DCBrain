'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bot,
  ChevronRight,
  Loader2,
  Play,
  X,
} from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import * as projectsApi from '@/lib/api/projects';
import * as agentsApi from '@/lib/api/agents';

// Status badge color mapping using design tokens
const STATUS_COLORS: Record<string, string> = {
  COMPLETED: 'status-success border',
  RUNNING:   'bg-[var(--color-info-bg)] border border-[var(--color-info-border)] text-[var(--color-info-text)]',
  PENDING:   'status-warning border',
  FAILED:    'status-danger border',
};

function AgentsPageContent() {
  const [projects, setProjects] = useState<projectsApi.Project[]>([]);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [agents, setAgents] = useState<agentsApi.AgentConfig[]>([]);
  const [runs, setRuns] = useState<agentsApi.AgentRunDetail[]>([]);
  const [selectedRun, setSelectedRun] = useState<agentsApi.AgentRunDetail | null>(null);
  const [supervisorQuery, setSupervisorQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [runningAgent, setRunningAgent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProjects() {
      try {
        const result = await projectsApi.listProjects();
        setProjects(result.projects);
        if (result.projects.length > 0) {
          setProjectId(result.projects[0].id);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load projects');
      }
    }
    void loadProjects();
  }, []);

  const loadAgentData = useCallback(async (pid: string) => {
    setLoading(true);
    setError(null);
    try {
      const [agentList, runHistory] = await Promise.all([
        agentsApi.listAgents(pid),
        agentsApi.listAgentRuns(pid),
      ]);
      setAgents(agentList);
      setRuns(runHistory);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load agent data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (projectId) {
      void loadAgentData(projectId);
    }
  }, [projectId, loadAgentData]);

  const handleRunAgent = async (agentType: string, query?: string) => {
    if (!projectId) return;
    setRunningAgent(agentType);
    setError(null);
    try {
      await agentsApi.triggerAgentRun(projectId, agentType, {
        query,
        runAsync: agentType !== 'SUPERVISOR',
      });
      await loadAgentData(projectId);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to trigger agent');
    } finally {
      setRunningAgent(null);
    }
  };

  const handleViewRun = async (runId: string) => {
    if (!projectId) return;
    try {
      const detail = await agentsApi.getAgentRunDetails(projectId, runId);
      setSelectedRun(detail);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load run details');
    }
  };

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === projectId) ?? null,
    [projectId, projects],
  );

  const headerActions = projects.length > 0 ? (
    <select
      value={projectId ?? ''}
      onChange={(e) => setProjectId(e.target.value)}
      className="h-9 min-w-44 rounded-lg border border-[var(--color-input)] bg-[var(--color-input-bg)] px-3 text-sm text-[var(--color-text-primary)] outline-none transition-colors focus:border-[var(--color-ring)] focus:ring-2 focus:ring-[var(--color-focus-ring)]"
    >
      {projects.map((p) => (
        <option key={p.id} value={p.id}>{p.name}</option>
      ))}
    </select>
  ) : null;

  return (
    <AppShell
      title="AI Agent Framework"
      subtitle={selectedProject
        ? `Supervisor orchestration and 14 specialized agents — ${selectedProject.name}`
        : 'Supervisor orchestration and 14 specialized agents for autonomous EPC intelligence'}
      headerActions={headerActions ?? undefined}
    >
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        {error && (
          <div className="rounded-lg border border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] px-4 py-3 text-sm text-[var(--color-danger-text)]">
            {error}
          </div>
        )}

        {/* Supervisor Agent */}
        {selectedProject && (
          <div className="card-level-1 p-6 transition-theme">
            <h3 className="mb-1 text-lg font-semibold text-[var(--color-text-primary)]">
              Supervisor Agent
            </h3>
            <p className="mb-4 text-sm text-[var(--color-text-secondary)]">
              Ask a natural-language question and the Supervisor will route it to the best sub-agent.
            </p>
            <div className="flex gap-3">
              <input
                type="text"
                value={supervisorQuery}
                onChange={(e) => setSupervisorQuery(e.target.value)}
                placeholder="e.g. Which procurement items are at risk of delay?"
                className="flex-1 rounded-lg border border-[var(--color-input)] bg-[var(--color-input-bg)] px-4 py-2 text-sm text-[var(--color-text-primary)] outline-none transition-colors placeholder:text-[var(--color-text-disabled)] focus:border-[var(--color-ring)] focus:ring-2 focus:ring-[var(--color-focus-ring)]"
              />
              <button
                onClick={() => void handleRunAgent('SUPERVISOR', supervisorQuery)}
                disabled={!supervisorQuery.trim() || runningAgent === 'SUPERVISOR'}
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {runningAgent === 'SUPERVISOR' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                Route Query
              </button>
            </div>
          </div>
        )}

        {/* Registered Agents */}
        <div className="card-level-1 overflow-hidden transition-theme">
          <div className="flex items-center justify-between border-b border-[var(--color-divider)] px-6 py-4">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
              Registered Agents
            </h3>
            {loading && <Loader2 className="h-5 w-5 animate-spin text-[var(--color-primary)]" />}
          </div>

          <div className="divide-y divide-[var(--color-divider)]">
            {agents.map((agent) => (
              <div key={agent.type} className="flex items-center justify-between gap-4 px-6 py-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4 text-[var(--color-primary)]" />
                    <p className="font-medium text-[var(--color-text-primary)]">{agent.name}</p>
                    <span className="font-mono text-xs text-[var(--color-text-tertiary)]">
                      {agent.type}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                    {agent.schedule
                      ? `Schedule: ${agent.schedule.cron} (${agent.schedule.isActive ? 'active' : 'paused'})`
                      : 'Manual / on-event trigger only'}
                    {agent.latestRun && (
                      <>
                        {' · '}Last run:{' '}
                        <span className={`inline-flex rounded px-2 py-0.5 text-xs ${STATUS_COLORS[agent.latestRun.status] ?? ''}`}>
                          {agent.latestRun.status}
                        </span>
                      </>
                    )}
                  </p>
                </div>

                {agent.type !== 'SUPERVISOR' && (
                  <button
                    onClick={() => void handleRunAgent(agent.type)}
                    disabled={runningAgent === agent.type}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-sm text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface-hover)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {runningAgent === agent.type ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Play className="h-3.5 w-3.5" />
                    )}
                    Run
                  </button>
                )}
              </div>
            ))}

            {!loading && agents.length === 0 && (
              <div className="px-6 py-8 text-center text-sm text-[var(--color-text-secondary)]">
                No agents loaded. Select a project to view the agent roster.
              </div>
            )}
          </div>
        </div>

        {/* Run History */}
        <div className="card-level-1 overflow-hidden transition-theme">
          <div className="border-b border-[var(--color-divider)] px-6 py-4">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Run History</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[var(--color-surface-raised)]">
                <tr>
                  {['Agent', 'Status', 'Duration', 'Started', ''].map((h) => (
                    <th
                      key={h}
                      className={`px-6 py-3 ${h === '' ? 'text-right' : 'text-left'} text-xs font-medium uppercase tracking-wide text-[var(--color-text-tertiary)]`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-divider)]">
                {runs.map((run) => (
                  <tr key={run.id} className="transition-colors hover:bg-[var(--color-surface-hover)]">
                    <td className="px-6 py-3 font-mono text-xs text-[var(--color-text-primary)]">
                      {run.agentType}
                    </td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex rounded px-2 py-0.5 text-xs ${STATUS_COLORS[run.status] ?? ''}`}>
                        {run.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-[var(--color-text-secondary)]">
                      {run.durationMs != null ? `${run.durationMs}ms` : '—'}
                    </td>
                    <td className="px-6 py-3 text-[var(--color-text-secondary)]">
                      {new Date(run.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <button
                        onClick={() => void handleViewRun(run.id)}
                        className="inline-flex items-center gap-1 text-sm text-[var(--color-link)] transition-colors hover:text-[var(--color-link-hover)]"
                      >
                        View <ChevronRight className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}

                {!loading && runs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-sm text-[var(--color-text-secondary)]">
                      No agent runs yet. Trigger an agent manually or import documents/schedule/procurement data.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Run Details Modal */}
      {selectedRun && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="card-level-3 flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden transition-theme">
            <div className="flex items-center justify-between border-b border-[var(--color-divider)] px-6 py-4">
              <div>
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
                  Run Details
                </h3>
                <p className="font-mono text-sm text-[var(--color-text-tertiary)]">
                  {selectedRun.id}
                </p>
              </div>
              <button
                onClick={() => setSelectedRun(null)}
                className="rounded-lg p-2 text-[var(--color-text-tertiary)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="scrollbar-thin overflow-y-auto p-6 text-sm">
              <div className="mb-4 grid grid-cols-2 gap-4">
                {[
                  { label: 'Agent', value: <span className="font-mono">{selectedRun.agentType}</span> },
                  {
                    label: 'Status',
                    value: (
                      <span className={`inline-flex rounded px-2 py-0.5 text-xs ${STATUS_COLORS[selectedRun.status] ?? ''}`}>
                        {selectedRun.status}
                      </span>
                    ),
                  },
                  { label: 'Duration', value: selectedRun.durationMs != null ? `${selectedRun.durationMs}ms` : '—' },
                  { label: 'Cost Estimate', value: selectedRun.costEstimate != null ? `$${selectedRun.costEstimate.toFixed(4)}` : '—' },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="mb-1 text-xs text-[var(--color-text-tertiary)]">{label}</p>
                    <div className="text-[var(--color-text-primary)]">{value}</div>
                  </div>
                ))}
              </div>

              {selectedRun.error && (
                <div className="mb-4 rounded-lg border border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] p-4 text-sm text-[var(--color-danger-text)]">
                  {selectedRun.error}
                </div>
              )}

              {selectedRun.output && (
                <div className="mb-4">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--color-text-tertiary)]">
                    Output
                  </p>
                  <pre className="scrollbar-thin overflow-x-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4 text-xs text-[var(--color-text-primary)] whitespace-pre-wrap">
                    {typeof selectedRun.output === 'string'
                      ? selectedRun.output
                      : JSON.stringify(selectedRun.output, null, 2)}
                  </pre>
                </div>
              )}

              {selectedRun.input && (
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--color-text-tertiary)]">
                    Input
                  </p>
                  <pre className="scrollbar-thin overflow-x-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4 text-xs text-[var(--color-text-primary)] whitespace-pre-wrap">
                    {JSON.stringify(selectedRun.input, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

export default function AgentsPage() {
  return (
    <ProtectedRoute>
      <AgentsPageContent />
    </ProtectedRoute>
  );
}
