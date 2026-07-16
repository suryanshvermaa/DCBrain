'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Activity, ChevronRight, Loader2, Plus } from 'lucide-react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import * as projectsApi from '@/lib/api/projects';
import * as simulationsApi from '@/lib/api/simulations';

const STATUS_STYLES: Record<string, string> = {
  COMPLETED: 'status-success border',
  FAILED:    'status-danger border',
  PENDING:   'status-warning border',
  RUNNING:   'bg-[var(--color-info-bg)] border border-[var(--color-info-border)] text-[var(--color-info-text)]',
};

function SimulationsPageContent() {
  const [projects, setProjects] = useState<projectsApi.Project[]>([]);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [simulations, setSimulations] = useState<simulationsApi.Simulation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProjects() {
      try {
        const result = await projectsApi.listProjects();
        setProjects(result.projects);
        if (result.projects.length > 0) {
          setProjectId(result.projects[0].id);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load projects');
      }
    }
    void loadProjects();
  }, []);

  const loadSimulations = useCallback(async (pid: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await simulationsApi.listSimulations(pid);
      setSimulations(result);
    } catch (err: any) {
      setError(err.message || 'Failed to load simulations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (projectId) {
      void loadSimulations(projectId);
    }
  }, [projectId, loadSimulations]);

  const headerActions = (
    <div className="flex items-center gap-2">
      {projects.length > 0 && (
        <select
          value={projectId ?? ''}
          onChange={(e) => setProjectId(e.target.value)}
          className="h-9 min-w-44 rounded-lg border border-[var(--color-input)] bg-[var(--color-input-bg)] px-3 text-sm text-[var(--color-text-primary)] outline-none transition-colors focus:border-[var(--color-ring)] focus:ring-2 focus:ring-[var(--color-focus-ring)]"
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      )}
      <Link
        href={`/simulations/new${projectId ? `?projectId=${projectId}` : ''}`}
        className="inline-flex h-9 items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-hover)]"
      >
        <Plus className="h-4 w-4" />
        New Simulation
      </Link>
    </div>
  );

  return (
    <AppShell
      title="Simulations"
      subtitle="Run what-if scenario simulations to analyze delay propagation and generate mitigation plans"
      headerActions={headerActions}
    >
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        {error && (
          <div className="rounded-lg border border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] px-4 py-3 text-sm text-[var(--color-danger-text)]">
            {error}
          </div>
        )}

        <div className="card-level-1 overflow-hidden transition-theme">
          <div className="flex items-center justify-between border-b border-[var(--color-divider)] px-6 py-4">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
              Simulation History
            </h3>
            {loading && <Loader2 className="h-5 w-5 animate-spin text-[var(--color-primary)]" />}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[var(--color-surface-raised)]">
                <tr>
                  {['Name', 'Target Activity', 'Delay', 'Status', ''].map((h) => (
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
                {simulations.map((sim) => (
                  <tr key={sim.id} className="transition-colors hover:bg-[var(--color-surface-hover)]">
                    <td className="px-6 py-3 font-medium text-[var(--color-text-primary)]">
                      {sim.name}
                    </td>
                    <td className="px-6 py-3 text-[var(--color-text-secondary)]">
                      {sim.targetActivityId}
                    </td>
                    <td className="px-6 py-3 text-[var(--color-text-secondary)]">
                      {sim.delayDays} days
                    </td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex rounded px-2 py-0.5 text-xs ${STATUS_STYLES[sim.status] ?? ''}`}>
                        {sim.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <Link
                        href={`/simulations/${sim.id}?projectId=${projectId}`}
                        className="inline-flex items-center gap-1 text-sm text-[var(--color-link)] transition-colors hover:text-[var(--color-link-hover)]"
                      >
                        View Results <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
                {!loading && simulations.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-[var(--color-text-secondary)]">
                      <Activity className="mx-auto mb-3 h-12 w-12 opacity-30" />
                      <p className="font-medium">No simulations run yet</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

export default function SimulationsPage() {
  return (
    <ProtectedRoute>
      <SimulationsPageContent />
    </ProtectedRoute>
  );
}
