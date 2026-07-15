'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity,
  Bot,
  Calendar,
  ChevronRight,
  FileText,
  HelpCircle,
  LayoutDashboard,
  Loader2,
  Package,
  Play,
  Search,
  Settings,
  Shield,
  X,
  Network,
  FileBarChart
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import * as projectsApi from '@/lib/api/projects';
import * as agentsApi from '@/lib/api/agents';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Documents', href: '/documents', icon: FileText },
  { name: 'Search', href: '/search', icon: Search },
  { name: 'Chat', href: '/chat', icon: Bot },
  { name: 'Compliance', href: '/compliance', icon: Shield },
  { name: 'Schedule', href: '/schedule', icon: Calendar },
  { name: 'Procurement', href: '/procurement', icon: Package },
  { name: 'Simulations', href: '/simulations', icon: Activity },
  { name: 'RFIs', href: '/rfis', icon: HelpCircle },
  { name: 'Agents', href: '/agents', icon: Bot },
  { name: 'Knowledge Graph', href: '/graph', icon: Network },
  { name: 'Reports', href: '/reports', icon: FileBarChart },
  { name: 'Settings', href: '/settings', icon: Settings },
];

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  RUNNING: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  FAILED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

function AgentsPageContent() {
  const pathname = usePathname();

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
        const message = err instanceof Error ? err.message : 'Failed to load projects';
        setError(message);
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
      const message = err instanceof Error ? err.message : 'Failed to load agent data';
      setError(message);
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
      const message = err instanceof Error ? err.message : 'Failed to trigger agent';
      setError(message);
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
      const message = err instanceof Error ? err.message : 'Failed to load run details';
      setError(message);
    }
  };

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === projectId) ?? null,
    [projectId, projects]
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex overflow-hidden">
      <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </span>
            DCBrain
          </h1>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-7xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">AI Agent Framework</h2>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                Supervisor orchestration and 14 specialized agents for autonomous EPC intelligence.
              </p>
            </div>

            {projects.length > 0 && (
              <select
                value={projectId ?? ''}
                onChange={(e) => setProjectId(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {selectedProject && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Supervisor Agent</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Ask a natural-language question and the Supervisor will route it to the best sub-agent.
              </p>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={supervisorQuery}
                  onChange={(e) => setSupervisorQuery(e.target.value)}
                  placeholder="e.g. Which procurement items are at risk of delay?"
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
                <button
                  onClick={() => void handleRunAgent('SUPERVISOR', supervisorQuery)}
                  disabled={!supervisorQuery.trim() || runningAgent === 'SUPERVISOR'}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {runningAgent === 'SUPERVISOR' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  Route Query
                </button>
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Registered Agents</h3>
              {loading && <Loader2 className="w-5 h-5 animate-spin text-blue-600" />}
            </div>

            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {agents.map((agent) => (
                <div key={agent.type} className="px-6 py-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Bot className="w-4 h-4 text-blue-600" />
                      <p className="font-medium text-gray-900 dark:text-white">{agent.name}</p>
                      <span className="text-xs text-gray-400 font-mono">{agent.type}</span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {agent.schedule
                        ? `Schedule: ${agent.schedule.cron} (${agent.schedule.isActive ? 'active' : 'paused'})`
                        : 'Manual / on-event trigger only'}
                      {agent.latestRun && (
                        <>
                          {' · '}
                          Last run:{' '}
                          <span className={`inline-flex px-2 py-0.5 rounded text-xs ${STATUS_COLORS[agent.latestRun.status] ?? ''}`}>
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
                      className="shrink-0 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {runningAgent === agent.type ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Play className="w-3.5 h-3.5" />
                      )}
                      Run
                    </button>
                  )}
                </div>
              ))}

              {!loading && agents.length === 0 && (
                <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                  No agents loaded. Select a project to view the agent roster.
                </div>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Run History</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <th className="px-6 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Agent</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Status</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Duration</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Started</th>
                    <th className="px-6 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {runs.map((run) => (
                    <tr key={run.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                      <td className="px-6 py-3 font-mono text-xs text-gray-700 dark:text-gray-300">{run.agentType}</td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs ${STATUS_COLORS[run.status] ?? ''}`}>
                          {run.status}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-gray-600 dark:text-gray-400">
                        {run.durationMs != null ? `${run.durationMs}ms` : '—'}
                      </td>
                      <td className="px-6 py-3 text-gray-600 dark:text-gray-400">
                        {new Date(run.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <button
                          onClick={() => void handleViewRun(run.id)}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 inline-flex items-center gap-1"
                        >
                          View <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}

                  {!loading && runs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                        No agent runs yet. Trigger an agent manually or import documents/schedule/procurement data.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {selectedRun && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Run Details</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">{selectedRun.id}</p>
              </div>
              <button
                onClick={() => setSelectedRun(null)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Agent</p>
                  <p className="font-mono text-gray-900 dark:text-white">{selectedRun.agentType}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Status</p>
                  <span className={`inline-flex px-2 py-0.5 rounded text-xs ${STATUS_COLORS[selectedRun.status] ?? ''}`}>
                    {selectedRun.status}
                  </span>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Duration</p>
                  <p className="text-gray-900 dark:text-white">
                    {selectedRun.durationMs != null ? `${selectedRun.durationMs}ms` : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Cost Estimate</p>
                  <p className="text-gray-900 dark:text-white">
                    {selectedRun.costEstimate != null ? `$${selectedRun.costEstimate.toFixed(4)}` : '—'}
                  </p>
                </div>
              </div>

              {selectedRun.error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-300">
                  {selectedRun.error}
                </div>
              )}

              {selectedRun.output && (
                <div>
                  <p className="text-gray-500 dark:text-gray-400 mb-2">Output</p>
                  <pre className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 overflow-x-auto text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                    {typeof selectedRun.output === 'string'
                      ? selectedRun.output
                      : JSON.stringify(selectedRun.output, null, 2)}
                  </pre>
                </div>
              )}

              {selectedRun.input && (
                <div>
                  <p className="text-gray-500 dark:text-gray-400 mb-2">Input</p>
                  <pre className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 overflow-x-auto text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                    {JSON.stringify(selectedRun.input, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AgentsPage() {
  return (
    <ProtectedRoute>
      <AgentsPageContent />
    </ProtectedRoute>
  );
}
