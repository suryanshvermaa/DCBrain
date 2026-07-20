'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Download,
  Loader2,
  TrendingUp,
  Upload,
  XCircle,
} from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import * as projectsApi from '@/lib/api/projects';
import * as scheduleApi from '@/lib/api/schedule';
import { ApiError } from '@/lib/api';

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

const RISK_COLORS: Record<scheduleApi.RiskLevel, string> = {
  LOW: '#22c55e',
  MEDIUM: '#f59e0b',
  HIGH: '#ef4444',
  CRITICAL: '#7c3aed',
};

const RISK_BG: Record<scheduleApi.RiskLevel, string> = {
  LOW: 'bg-green-100 text-green-800',
  MEDIUM: 'bg-amber-100 text-amber-800',
  HIGH: 'bg-red-100 text-red-800',
  CRITICAL: 'bg-violet-100 text-violet-800',
};

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function spiColor(spi: number): string {
  if (spi >= 0.95) return 'text-[var(--color-success-text)]';
  if (spi >= 0.8) return 'text-[var(--color-warning-text)]';
  return 'text-[var(--color-danger-text)]';
}

function riskBadge(level: scheduleApi.RiskLevel) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${RISK_BG[level]}`}
    >
      {level}
    </span>
  );
}

// --------------------------------------------------------------------------
// Sub-components
// --------------------------------------------------------------------------

interface HealthCardProps {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  color?: string;
}

function HealthCard({ label, value, sub, icon, color = 'text-[var(--color-text-primary)]' }: HealthCardProps) {
  return (
    <div className="card-level-1 flex items-start gap-4 p-5 transition-theme">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-primary-100)] text-[var(--color-primary)]">
        {icon}
      </div>
      <div>
        <p className="text-sm text-[var(--color-text-secondary)]">{label}</p>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
        {sub ? <p className="mt-0.5 text-xs text-[var(--color-text-tertiary)]">{sub}</p> : null}
      </div>
    </div>
  );
}

interface ActivityRowProps {
  activity: scheduleApi.ScheduleActivity;
}

function ActivityRow({ activity }: ActivityRowProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <tr
        className="cursor-pointer border-b border-[var(--color-divider)] transition-colors hover:bg-[var(--color-surface-hover)]"
        onClick={() => setExpanded((v) => !v)}
      >
        <td className="py-3 pl-4 pr-2">
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-[var(--color-text-tertiary)]" />
          ) : (
            <ChevronRight className="h-4 w-4 text-[var(--color-text-tertiary)]" />
          )}
        </td>
        <td className="max-w-xs py-3 pr-4 text-sm font-medium text-[var(--color-text-primary)]">
          <span className="block truncate" title={activity.name}>
            {activity.name}
          </span>
          <span className="text-xs text-[var(--color-text-tertiary)]">{activity.activityId}</span>
        </td>
        <td className="py-3 pr-4 text-sm text-[var(--color-text-secondary)]">{activity.wbsCode ?? '—'}</td>
        <td className="py-3 pr-4 text-sm text-[var(--color-text-secondary)]">{formatDate(activity.plannedStart)}</td>
        <td className="py-3 pr-4 text-sm text-[var(--color-text-secondary)]">{formatDate(activity.plannedFinish)}</td>
        <td className="py-3 pr-4 text-sm text-[var(--color-text-secondary)]">{activity.durationDays.toFixed(1)}d</td>
        <td className="py-3 pr-4 text-sm text-[var(--color-text-secondary)]">{activity.totalFloat.toFixed(1)}d</td>
        <td className="py-3 pr-4">
          {activity.isCritical ? (
            <span className="status-danger inline-block rounded-full border px-2 py-0.5 text-xs font-semibold">
              Critical
            </span>
          ) : (
            <span className="inline-block rounded-full bg-[var(--color-badge-default-bg)] px-2 py-0.5 text-xs text-[var(--color-badge-default-text)]">
              —
            </span>
          )}
        </td>
        <td className="py-3 pr-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-16 overflow-hidden rounded-full bg-[var(--color-surface-raised)]">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${activity.riskScore}%`,
                  backgroundColor: RISK_COLORS[activity.riskLevel],
                }}
              />
            </div>
            <span className="text-xs font-medium text-[var(--color-text-primary)]">{activity.riskScore}</span>
          </div>
        </td>
        <td className="py-3 pr-4">{riskBadge(activity.riskLevel)}</td>
      </tr>
      {expanded && (
        <tr className="bg-[var(--color-sidebar-active)]">
          <td colSpan={10} className="px-8 py-4">
            <div className="space-y-3">
              {activity.mitigationActions.length > 0 ? (
                <>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
                    Recommended Mitigations
                  </p>
                  <ul className="space-y-1.5">
                    {activity.mitigationActions.map((action, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-[var(--color-text-primary)]">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--color-primary)]" />
                        {action}
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="text-sm text-[var(--color-text-secondary)]">No mitigation actions recorded.</p>
              )}
              {activity.predecessors.length > 0 && (
                <p className="text-xs text-[var(--color-text-tertiary)]">
                  Predecessors: {activity.predecessors.join(', ')}
                </p>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// --------------------------------------------------------------------------
// Custom scatter tooltip
// --------------------------------------------------------------------------

interface ScatterDatum {
  x: number;
  y: number;
  name: string;
  riskLevel: scheduleApi.RiskLevel;
  activityId: string;
}

function RiskTooltip({ active, payload }: { active?: boolean; payload?: { payload: ScatterDatum }[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="card-level-2 px-3 py-2 text-sm">
      <p className="max-w-xs truncate font-semibold text-[var(--color-text-primary)]">{d.name}</p>
      <p className="text-xs text-[var(--color-text-tertiary)]">{d.activityId}</p>
      <p className="mt-1 text-[var(--color-text-secondary)]">
        Risk score: <span className="font-medium text-[var(--color-text-primary)]">{d.y}</span>
      </p>
      <span
        className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold uppercase ${RISK_BG[d.riskLevel]}`}
      >
        {d.riskLevel}
      </span>
    </div>
  );
}

// --------------------------------------------------------------------------
// Main page
// --------------------------------------------------------------------------

type FilterLevel = 'ALL' | scheduleApi.RiskLevel;

function SchedulePageContent() {
  const [projects, setProjects] = useState<projectsApi.Project[]>([]);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [summary, setSummary] = useState<scheduleApi.ScheduleRiskSummary | null>(null);
  const [activities, setActivities] = useState<scheduleApi.ScheduleActivity[]>([]);
  const [imports, setImports] = useState<scheduleApi.ScheduleImport[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [filterLevel, setFilterLevel] = useState<FilterLevel>('ALL');
  const [showCriticalOnly, setShowCriticalOnly] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ---------- Data loading ----------

  useEffect(() => {
    void projectsApi.listProjects().then((result) => {
      setProjects(result.projects);
      setProjectId((cur) => cur ?? result.projects[0]?.id ?? null);
    });
  }, []);

  const loadProjectData = useCallback(async (pid: string) => {
    setLoading(true);
    setError(null);
    try {
      const [sum, acts, imps] = await Promise.all([
        scheduleApi.getScheduleRiskSummary(pid),
        scheduleApi.getScheduleActivities(pid),
        scheduleApi.listScheduleImports(pid),
      ]);
      setSummary(sum);
      setActivities(acts.activities);
      setImports(imps);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to load schedule data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!projectId) return;
    void loadProjectData(projectId);
  }, [projectId, loadProjectData]);

  // ---------- File import ----------

  async function handleImport(file: File) {
    if (!projectId) return;
    setImporting(true);
    setImportError(null);
    setImportSuccess(null);
    try {
      const result = await scheduleApi.importScheduleFile(projectId, file);
      setImportSuccess(
        `Import complete — ${result.activityCount} activities processed.`
      );
      await loadProjectData(projectId);
      setTimeout(() => setImportSuccess(null), 5000);
    } catch (err) {
      setImportError(err instanceof ApiError ? err.message : String(err));
    } finally {
      setImporting(false);
    }
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void handleImport(file);
    e.target.value = '';
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void handleImport(file);
  }

  // ---------- Derived data ----------

  const filteredActivities = useMemo(() => {
    return activities.filter((a) => {
      if (filterLevel !== 'ALL' && a.riskLevel !== filterLevel) return false;
      if (showCriticalOnly && !a.isCritical) return false;
      return true;
    });
  }, [activities, filterLevel, showCriticalOnly]);

  const scatterData: ScatterDatum[] = useMemo(
    () =>
      activities.map((a) => ({
        x: a.plannedStart ? new Date(a.plannedStart).getTime() : 0,
        y: a.riskScore,
        name: a.name,
        riskLevel: a.riskLevel,
        activityId: a.activityId,
      })),
    [activities]
  );

  const health = summary?.health;
  const selectedProject = projects.find((p) => p.id === projectId);

  // ---------- Render ----------

  const headerActions = (
    <div className="flex items-center gap-2">
      <select
        className="h-9 min-w-44 rounded-lg border border-[var(--color-input)] bg-[var(--color-input-bg)] px-3 text-sm text-[var(--color-text-primary)] outline-none transition-colors focus:border-[var(--color-ring)] focus:ring-2 focus:ring-[var(--color-focus-ring)]"
        value={projectId ?? ''}
        onChange={(e) => setProjectId(e.target.value || null)}
      >
        {projects.length === 0 ? <option value="">No projects</option> : null}
        {projects.map((p) => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>
      <button
        type="button"
        className="inline-flex h-9 items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
        onClick={() => fileInputRef.current?.click()}
        disabled={importing || !projectId}
      >
        {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        {importing ? 'Importing…' : 'Import XML'}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".xml,application/xml,text/xml"
        className="hidden"
        onChange={onFileChange}
      />
    </div>
  );

  return (
    <AppShell
      title="Schedule Risk"
      subtitle={selectedProject ? `${selectedProject.name} · ${selectedProject.code}` : 'Import P6 XML schedules and analyse delay risks per activity'}
      headerActions={headerActions}
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-6 p-6">
          {/* Alerts */}
          {error ? (
            <div className="flex items-center gap-2 rounded-lg border border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] px-4 py-3 text-sm text-[var(--color-danger-text)]">
              <XCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          ) : null}
          {importError ? (
            <div className="flex items-center gap-2 rounded-lg border border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] px-4 py-3 text-sm text-[var(--color-danger-text)]">
              <XCircle className="h-4 w-4 flex-shrink-0" />
              {importError}
            </div>
          ) : null}
          {importSuccess ? (
            <div className="flex items-center gap-2 rounded-lg border border-[var(--color-success-border)] bg-[var(--color-success-bg)] px-4 py-3 text-sm text-[var(--color-success-text)]">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
              {importSuccess}
            </div>
          ) : null}

          {loading ? (
            <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-[var(--color-border)] text-sm text-[var(--color-text-secondary)]">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading schedule data…
            </div>
          ) : health && health.totalActivities > 0 ? (
            <>
              {/* Health Indicators */}
              <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <HealthCard
                  label="Schedule Performance Index"
                  value={health.spi.toFixed(2)}
                  sub={health.spi >= 0.95 ? 'On track' : health.spi >= 0.8 ? 'Minor delays' : 'Behind schedule'}
                  icon={<TrendingUp className="h-5 w-5" />}
                  color={spiColor(health.spi)}
                />
                <HealthCard
                  label="Critical Path Activities"
                  value={`${health.criticalPathCount}`}
                  sub={`of ${health.totalActivities} total`}
                  icon={<AlertTriangle className="h-5 w-5" />}
                  color={health.criticalPathCount > 0 ? 'text-red-600' : 'text-green-600'}
                />
                <HealthCard
                  label="High / Critical Risk"
                  value={`${health.highRiskCount}`}
                  sub="activities requiring action"
                  icon={<Clock className="h-5 w-5" />}
                  color={health.highRiskCount > 0 ? 'text-amber-600' : 'text-green-600'}
                />
                <HealthCard
                  label="Predicted Completion"
                  value={
                    health.predictedCompletionDate
                      ? formatDate(health.predictedCompletionDate)
                      : '—'
                  }
                  sub={`Float consumption: ${(health.floatConsumptionRate * 100).toFixed(0)}%`}
                  icon={<Calendar className="h-5 w-5" />}
                />
              </section>

              {/* Risk Distribution + Heat Map */}
              <section className="grid gap-6 lg:grid-cols-[1fr_2fr]">
                {/* Distribution */}
                <div className="card-level-1 p-6 transition-theme">
                  <h2 className="mb-4 text-lg font-semibold text-[var(--color-text-primary)]">Risk Distribution</h2>
                  <div className="space-y-3">
                    {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as scheduleApi.RiskLevel[]).map(
                      (level) => {
                        const count = summary.riskDistribution[level];
                        const pct =
                          health.totalActivities > 0
                            ? Math.round((count / health.totalActivities) * 100)
                            : 0;
                        return (
                          <div key={level}>
                            <div className="mb-1 flex justify-between text-sm">
                              <span className="font-medium text-[var(--color-text-primary)]">{level}</span>
                              <span className="text-[var(--color-text-secondary)]">
                                {count} ({pct}%)
                              </span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-[var(--color-surface-raised)]">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${pct}%`,
                                  backgroundColor: RISK_COLORS[level],
                                }}
                              />
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                  <div className="mt-6">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
                      Overall Risk Score
                    </p>
                    <p
                      className="mt-1 text-3xl font-bold"
                      style={{ color: RISK_COLORS[health.overallRiskScore >= 75 ? 'CRITICAL' : health.overallRiskScore >= 50 ? 'HIGH' : health.overallRiskScore >= 25 ? 'MEDIUM' : 'LOW'] }}
                    >
                      {health.overallRiskScore}
                      <span className="ml-1 text-base font-normal text-[var(--color-text-tertiary)]">/ 100</span>
                    </p>
                  </div>
                </div>

                {/* Heat Map */}
                <div className="card-level-1 p-6 transition-theme">
                  <h2 className="mb-4 text-lg font-semibold text-[var(--color-text-primary)]">Risk Heat Map</h2>
                  <p className="mb-4 text-xs text-[var(--color-text-tertiary)]">
                    X-axis: planned start date · Y-axis: risk score · Colour: risk level
                  </p>
                  <ResponsiveContainer width="100%" height={280}>
                    <ScatterChart margin={{ top: 4, right: 8, bottom: 8, left: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-divider)" strokeOpacity={0.6} />
                      <XAxis
                        dataKey="x"
                        type="number"
                        domain={['dataMin', 'dataMax']}
                        tickFormatter={(v: number) =>
                          v > 0
                            ? new Date(v).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })
                            : ''
                        }
                        tick={{ fontSize: 11 }}
                        name="Planned Start"
                      />
                      <YAxis
                        dataKey="y"
                        domain={[0, 100]}
                        tick={{ fontSize: 11 }}
                        name="Risk Score"
                        label={{ value: 'Risk', angle: -90, position: 'insideLeft', offset: 10, fontSize: 11 }}
                      />
                      <Tooltip content={<RiskTooltip />} />
                      <Scatter data={scatterData} isAnimationActive={false}>
                        {scatterData.map((entry, idx) => (
                          <Cell
                            key={`cell-${idx}`}
                            fill={RISK_COLORS[entry.riskLevel]}
                            fillOpacity={0.8}
                          />
                        ))}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </section>

              {/* Activities Table */}
              <section className="card-level-1 overflow-hidden transition-theme">
                <div className="flex flex-col gap-3 border-b border-[var(--color-divider)] px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                    Activities
                    <span className="ml-2 text-sm font-normal text-[var(--color-text-tertiary)]">
                      ({filteredActivities.length} of {activities.length})
                    </span>
                  </h2>
                  <div className="flex flex-wrap items-center gap-3">
                    <select
                      className="h-8 rounded-lg border border-[var(--color-input)] bg-[var(--color-input-bg)] px-3 text-sm text-[var(--color-text-primary)] outline-none"
                      value={filterLevel}
                      onChange={(e) => setFilterLevel(e.target.value as FilterLevel)}
                    >
                      <option value="ALL">All risk levels</option>
                      <option value="CRITICAL">Critical</option>
                      <option value="HIGH">High</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="LOW">Low</option>
                    </select>
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-[var(--color-border)]"
                        checked={showCriticalOnly}
                        onChange={(e) => setShowCriticalOnly(e.target.checked)}
                      />
                      Critical path only
                    </label>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-[var(--color-divider)] bg-[var(--color-surface-raised)] text-xs font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
                        <th className="py-3 pl-4 pr-2 w-8" />
                        <th className="py-3 pr-4">Activity</th>
                        <th className="py-3 pr-4">WBS</th>
                        <th className="py-3 pr-4">Planned Start</th>
                        <th className="py-3 pr-4">Planned Finish</th>
                        <th className="py-3 pr-4">Duration</th>
                        <th className="py-3 pr-4">Float</th>
                        <th className="py-3 pr-4">Critical</th>
                        <th className="py-3 pr-4">Risk Score</th>
                        <th className="py-3 pr-4">Level</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredActivities.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="py-12 text-center text-sm text-[var(--color-text-tertiary)]">
                            No activities match the current filters.
                          </td>
                        </tr>
                      ) : (
                        filteredActivities.map((activity) => (
                          <ActivityRow key={activity.id} activity={activity} />
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Import History */}
              {imports.length > 0 && (
                <section className="card-level-1 p-6 transition-theme">
                  <h2 className="mb-4 text-lg font-semibold text-[var(--color-text-primary)]">Import History</h2>
                  <div className="space-y-2">
                    {imports.map((imp) => (
                      <div
                        key={imp.id}
                        className="flex items-center justify-between rounded-lg border border-[var(--color-border)] px-4 py-3 text-sm"
                      >
                        <div className="flex items-center gap-3">
                          <Download className="h-4 w-4 text-[var(--color-text-tertiary)]" />
                          <div>
                            <p className="font-medium text-[var(--color-text-primary)]">{imp.filename}</p>
                            <p className="text-xs text-[var(--color-text-tertiary)]">{formatDate(imp.importedAt)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[var(--color-text-secondary)]">{imp.activityCount} activities</span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-semibold uppercase ${
                              imp.status === 'SUCCESS'
                                ? 'status-success border'
                                : imp.status === 'PARTIAL'
                                ? 'status-warning border'
                                : 'status-danger border'
                            }`}
                          >
                            {imp.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          ) : !loading && projectId ? (
            /* Empty state — drop zone */
            <div
              className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-20 transition-colors ${
                isDragging ? 'border-[var(--color-primary)] bg-[var(--color-sidebar-active)]' : 'border-[var(--color-border)] bg-[var(--color-surface)]'
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
            >
              <Upload className="mb-4 h-12 w-12 text-[var(--color-text-disabled)]" />
              <p className="text-lg font-semibold text-[var(--color-text-primary)]">No schedule imported yet</p>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                Drag &amp; drop a Primavera P6 XML file here, or click the button above.
              </p>
              <button
                type="button"
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-hover)] disabled:opacity-60"
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
              >
                {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {importing ? 'Importing…' : 'Select File'}
              </button>
            </div>
          ) : null}
        </div>
    </AppShell>
  );
}

export default function SchedulePage() {
  return (
    <ProtectedRoute>
      <SchedulePageContent />
    </ProtectedRoute>
  );
}
