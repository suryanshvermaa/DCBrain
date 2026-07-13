'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, RefreshCw, ShieldCheck } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import * as projectsApi from '@/lib/api/projects';
import * as complianceApi from '@/lib/api/compliance';
import { ApiError } from '@/lib/api';

export default function CompliancePage() {
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
        setError(requestError instanceof ApiError ? requestError.message : 'Unable to load projects');
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
        setError(requestError instanceof ApiError ? requestError.message : 'Unable to load compliance summary');
      } finally {
        setLoading(false);
      }
    }

    void loadSummary();
  }, [projectId]);

  const selectedProject = useMemo(() => projects.find((project) => project.id === projectId) ?? null, [projectId, projects]);

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
      setError(requestError instanceof ApiError ? requestError.message : 'Unable to run compliance check');
    } finally {
      setRunning(false);
    }
  }

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-6">
          <header className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-600 text-white">
                    <ShieldCheck className="h-5 w-5" />
                  </span>
                  <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Compliance</h1>
                    <p className="text-sm text-gray-500">Run standards-based compliance reviews and review findings per project.</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <select
                  className="h-10 min-w-56 rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none"
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
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 text-sm font-semibold text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={() => void handleRunCheck()}
                  disabled={running || !projectId}
                >
                  {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  {running ? 'Checking…' : 'Run check'}
                </button>
              </div>
            </div>
            {selectedProject ? <p className="mt-4 text-sm text-gray-500">Selected project: {selectedProject.name} ({selectedProject.code})</p> : null}
          </header>

          {error ? <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

          <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Compliance summary</h2>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-700">{summary?.latestCheck ? 'Latest review' : 'No review yet'}</span>
              </div>
              {loading ? (
                <div className="mt-6 flex min-h-48 items-center justify-center rounded-lg border border-dashed border-gray-300 text-sm text-gray-500">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading compliance data
                </div>
              ) : summary ? (
                <div className="mt-6 space-y-4">
                  <div className="rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Overall compliance score</p>
                        <p className="text-3xl font-semibold text-gray-900">{summary.summary.complianceScore}%</p>
                      </div>
                      <div className="rounded-full bg-green-100 p-3 text-green-700">
                        <CheckCircle2 className="h-6 w-6" />
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-lg border border-gray-200 p-4">
                      <p className="text-sm text-gray-500">Total findings</p>
                      <p className="text-xl font-semibold text-gray-900">{summary.summary.totalFindings}</p>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-4">
                      <p className="text-sm text-gray-500">Warnings</p>
                      <p className="text-xl font-semibold text-amber-700">{summary.summary.warningFindings}</p>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-4">
                      <p className="text-sm text-gray-500">Failures</p>
                      <p className="text-xl font-semibold text-red-700">{summary.summary.failedFindings}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-6 rounded-lg border border-dashed border-gray-300 p-6 text-sm text-gray-500">
                  Select a project and run a compliance check to begin.
                </div>
              )}
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <h2 className="text-lg font-semibold text-gray-900">How it works</h2>
              </div>
              <ul className="mt-4 space-y-3 text-sm text-gray-600">
                <li>• Upload specification documents for the selected project.</li>
                <li>• Run the compliance review against standards such as ASHRAE, NFPA, and TIA-942.</li>
                <li>• Review findings with evidence and recommended remediation steps.</li>
              </ul>
            </div>
          </section>
        </div>
      </main>
    </ProtectedRoute>
  );
}
