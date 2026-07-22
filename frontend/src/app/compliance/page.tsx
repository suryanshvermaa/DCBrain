'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, RefreshCw, ShieldCheck } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import * as projectsApi from '@/lib/api/projects';
import * as complianceApi from '@/lib/api/compliance';
import { ApiError } from '@/lib/api';

function CompliancePageContent() {
  const [projects, setProjects] = useState<projectsApi.Project[]>([]);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [summary, setSummary] = useState<complianceApi.ComplianceSummaryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    async function loadProjects() {
      try {
        const result = await projectsApi.listProjects();
        setProjects(result.projects);
        setProjectId((current) => current ?? result.projects[0]?.id ?? null);
      } catch (requestError) {
        setError(
          requestError instanceof ApiError ? requestError.message : 'Unable to load projects',
        );
      }
    }
    void loadProjects();
  }, []);

  useEffect(() => {
    if (!projectId) return;
    const activeProjectId = projectId;
    async function loadSummary() {
      setLoading(true);
      setError(null);
      try {
        const result = await complianceApi.getComplianceSummary(activeProjectId);
        setSummary(result);
      } catch (requestError) {
        setError(
          requestError instanceof ApiError
            ? requestError.message
            : 'Unable to load compliance summary',
        );
      } finally {
        setLoading(false);
      }
    }
    void loadSummary();
  }, [projectId]);

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === projectId) ?? null,
    [projectId, projects],
  );

  async function handleRunCheck() {
    if (!projectId) return;
    setRunning(true);
    setError(null);
    try {
      const result = await complianceApi.runComplianceCheck(projectId, {
        standards: ['ASHRAE 90.4', 'NFPA 75'],
        documentIds: [],
      });
      setSummary({
        projectId,
        latestCheck: {
          id: result.id,
          complianceScore: result.complianceScore,
          status: result.status,
          createdAt: result.createdAt,
          findings: result.findings,
          standards: result.standards,
        },
        summary: {
          totalFindings: result.summary.totalFindings,
          compliantFindings: result.summary.compliantFindings,
          warningFindings: result.summary.warningFindings,
          failedFindings: result.summary.failedFindings,
          complianceScore: result.complianceScore,
        },
      });
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : 'Unable to run compliance check',
      );
    } finally {
      setRunning(false);
    }
  }

  const headerActions = (
    <div className="flex items-center gap-2">
      <select
        className="h-9 min-w-44 rounded-lg border border-[var(--color-input)] bg-[var(--color-input-bg)] px-3 text-sm text-[var(--color-text-primary)] outline-none transition-colors focus:border-[var(--color-ring)] focus:ring-2 focus:ring-[var(--color-focus-ring)]"
        value={projectId ?? ''}
        onChange={(event) => setProjectId(event.target.value || null)}
      >
        {projects.length === 0 ? <option value="">No projects</option> : null}
        {projects.map((project) => (
          <option key={project.id} value={project.id}>
            {project.name}
          </option>
        ))}
      </select>
      <button
        type="button"
        className="inline-flex h-9 items-center gap-2 rounded-lg bg-[var(--color-warning)] px-4 text-sm font-semibold text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        onClick={() => void handleRunCheck()}
        disabled={running || !projectId}
      >
        {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
        {running ? 'Checking…' : 'Run check'}
      </button>
    </div>
  );

  return (
    <AppShell
      title="Compliance"
      subtitle={
        selectedProject
          ? `${selectedProject.name} (${selectedProject.code})`
          : 'Run standards-based compliance reviews and review findings per project'
      }
      headerActions={headerActions}
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-6 p-6">
        {error && (
          <div className="rounded-lg border border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] px-4 py-3 text-sm text-[var(--color-danger-text)]">
            {error}
          </div>
        )}

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Compliance Summary */}
          <div className="card-level-1 p-6 transition-theme">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                Compliance Summary
              </h2>
              <span className="rounded-full border border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] px-3 py-1 text-sm font-medium text-[var(--color-warning-text)]">
                {summary?.latestCheck ? 'Latest review' : 'No review yet'}
              </span>
            </div>

            {loading ? (
              <div className="mt-6 flex min-h-48 items-center justify-center rounded-lg border border-dashed border-[var(--color-border)] text-sm text-[var(--color-text-secondary)]">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading compliance data
              </div>
            ) : summary ? (
              <div className="mt-6 space-y-4">
                {/* Score row */}
                <div className="rounded-lg border border-[var(--color-border)] p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-[var(--color-text-secondary)]">
                        Overall compliance score
                      </p>
                      <p className="text-3xl font-semibold text-[var(--color-text-primary)]">
                        {summary.summary.complianceScore}%
                      </p>
                    </div>
                    <div className="rounded-full bg-[var(--color-success-bg)] p-3 text-[var(--color-success)]">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                  </div>
                </div>

                {/* Stat grid */}
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    { label: 'Total findings', value: summary.summary.totalFindings, colorClass: '' },
                    { label: 'Warnings', value: summary.summary.warningFindings, colorClass: 'text-[var(--color-warning-text)]' },
                    { label: 'Failures', value: summary.summary.failedFindings, colorClass: 'text-[var(--color-danger-text)]' },
                  ].map(({ label, value, colorClass }) => (
                    <div key={label} className="rounded-lg border border-[var(--color-border)] p-4">
                      <p className="text-sm text-[var(--color-text-secondary)]">{label}</p>
                      <p className={`text-xl font-semibold text-[var(--color-text-primary)] ${colorClass}`}>
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-6 rounded-lg border border-dashed border-[var(--color-border)] p-6 text-sm text-[var(--color-text-secondary)]">
                Select a project and run a compliance check to begin.
              </div>
            )}
          </div>

          {/* How it works */}
          <div className="card-level-1 p-6 transition-theme">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-[var(--color-warning)]" />
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                How it works
              </h2>
            </div>
            <ul className="mt-4 space-y-3 text-sm text-[var(--color-text-secondary)]">
              <li>• Upload specification documents for the selected project.</li>
              <li>
                • Run the compliance review against standards such as ASHRAE, NFPA, and TIA-942.
              </li>
              <li>
                • Review findings with evidence and recommended remediation steps.
              </li>
            </ul>
          </div>
        </section>

        {summary?.latestCheck?.findings && summary.latestCheck.findings.length > 0 && (
          <section className="card-level-1 p-6 transition-theme space-y-6">
            <div className="flex items-center justify-between border-b border-[var(--color-divider)] pb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-[var(--color-primary)]" />
                <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                  Detailed Audit Findings & Evidence
                </h2>
              </div>
              <span className="rounded-full bg-[var(--color-surface-raised)] px-3 py-1 text-xs font-medium text-[var(--color-text-secondary)]">
                {summary.latestCheck.findings.length} item{summary.latestCheck.findings.length !== 1 ? 's' : ''} evaluated
              </span>
            </div>

            <div className="space-y-4">
              {summary.latestCheck.findings.map((f, idx) => {
                const statusStyles =
                  f.status === 'PASS'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800/40'
                    : f.status === 'FAIL'
                    ? 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800/40'
                    : 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800/40';

                return (
                  <div
                    key={f.id || idx}
                    className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-5 transition-colors hover:border-[var(--color-ring)]"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--color-divider)]">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusStyles}`}
                        >
                          {f.status}
                        </span>
                        <span className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-tertiary)] bg-[var(--color-surface)] px-2.5 py-0.5 rounded border border-[var(--color-border)]">
                          {f.standard}
                        </span>
                        {f.severity && (
                          <span className="text-xs text-[var(--color-text-secondary)] capitalize">
                            Severity: <strong className="font-semibold text-[var(--color-text-primary)]">{f.severity}</strong>
                          </span>
                        )}
                      </div>
                      {f.evidenceSource && (
                        <span className="text-xs text-[var(--color-text-tertiary)] italic">
                          Source: {f.evidenceSource}
                        </span>
                      )}
                    </div>

                    <div className="mt-3.5 space-y-3">
                      <div>
                        <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">
                          {f.requirement}
                        </h4>
                      </div>

                      {f.evidence && (
                        <div className="rounded-md bg-[var(--color-surface)] border border-[var(--color-divider)] p-3 text-xs text-[var(--color-text-secondary)] space-y-1">
                          <span className="font-semibold text-[var(--color-text-primary)] block">Evidence & Analysis:</span>
                          <p className="leading-relaxed">{f.evidence}</p>
                        </div>
                      )}

                      {f.recommendation && f.status !== 'PASS' && (
                        <div className="rounded-md bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 p-3 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                          <span className="font-semibold text-amber-800 dark:text-amber-300 block">Recommended Action:</span>
                          <p className="leading-relaxed">{f.recommendation}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}

export default function CompliancePage() {
  return (
    <ProtectedRoute>
      <CompliancePageContent />
    </ProtectedRoute>
  );
}
