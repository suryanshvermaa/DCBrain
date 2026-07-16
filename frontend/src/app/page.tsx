'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  FileText,
  RefreshCw,
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  Shield,
  Zap,
  HelpCircle,
  Activity,
  Package,
  BarChart3,
} from 'lucide-react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import * as projectsApi from '@/lib/api/projects';
import * as dashboardApi from '@/lib/api/dashboard';
import { ApiError } from '@/lib/api';

// ---------------------------------------------------------------------------
// Design-token color helpers — no raw hex
// ---------------------------------------------------------------------------

function getScoreColor(score: number): string {
  if (score >= 75) return 'var(--color-success)';
  if (score >= 50) return 'var(--color-warning)';
  return 'var(--color-danger)';
}

function getScoreTailwind(score: number): string {
  if (score >= 75) return 'text-[var(--color-success-text)]';
  if (score >= 50) return 'text-[var(--color-warning-text)]';
  return 'text-[var(--color-danger-text)]';
}

function getRiskAccent(count: number, low = 0, high = 5): string {
  if (count === low) return 'bg-success-600';
  if (count <= high) return 'bg-warning-500';
  return 'bg-danger-600';
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Circular health score gauge rendered via SVG */
function HealthGauge({ score }: { score: number }) {
  const radius = 54;
  const stroke = 10;
  const circumference = 2 * Math.PI * radius;
  const filled = (score / 100) * circumference;
  const color = getScoreColor(score);

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={130} height={130} viewBox="0 0 130 130">
        {/* Background ring */}
        <circle
          cx={65}
          cy={65}
          r={radius}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={stroke}
        />
        {/* Score arc */}
        <circle
          cx={65}
          cy={65}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={`${filled} ${circumference - filled}`}
          strokeLinecap="round"
          transform="rotate(-90 65 65)"
          style={{ transition: 'stroke-dasharray 0.8s ease' }}
        />
        {/* Score number */}
        <text
          x={65}
          y={60}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={28}
          fontWeight={700}
          fill={color}
        >
          {score}
        </text>
        {/* Denominator */}
        <text
          x={65}
          y={82}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={11}
          fill="var(--color-text-tertiary)"
        >
          / 100
        </text>
      </svg>
      <span className="text-sm font-medium text-[var(--color-text-secondary)]">
        Project Health
      </span>
    </div>
  );
}

/** Single KPI stat card */
function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accentClass,
  trend,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  accentClass: string;
  trend?: 'up' | 'down' | 'neutral';
}) {
  const TrendIcon =
    trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor =
    trend === 'up'
      ? 'text-[var(--color-success-text)]'
      : trend === 'down'
      ? 'text-[var(--color-danger-text)]'
      : 'text-[var(--color-text-disabled)]';

  return (
    <div className="card-level-1 flex flex-col gap-3 p-5 transition-theme">
      <div className="flex items-center justify-between">
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${accentClass}`}
        >
          <Icon className="h-5 w-5 text-white" />
        </span>
        {trend && (
          <span className={`flex items-center gap-1 text-xs font-medium ${trendColor}`}>
            <TrendIcon className="h-3.5 w-3.5" />
          </span>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold text-[var(--color-text-primary)]">{value}</p>
        <p className="text-sm text-[var(--color-text-secondary)]">{label}</p>
        {sub && (
          <p className="mt-0.5 text-xs text-[var(--color-text-tertiary)]">{sub}</p>
        )}
      </div>
    </div>
  );
}

/** Horizontal category progress bar */
function CategoryBar({
  label,
  count,
  total,
}: {
  label: string;
  count: number;
  total: number;
}) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-32 truncate text-xs capitalize text-[var(--color-text-secondary)]">
        {label}
      </span>
      <div className="h-2 flex-1 rounded-full bg-[var(--color-surface-raised)]">
        <div
          className="h-2 rounded-full bg-[var(--color-primary)] transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-8 text-right text-xs font-medium text-[var(--color-text-primary)]">
        {count}
      </span>
    </div>
  );
}

/** Activity feed item */
function ActivityItem({ item }: { item: dashboardApi.ActivityFeedItem }) {
  const typeIcon: Record<string, React.ElementType> = {
    DOCUMENT_UPLOAD: FileText,
    DOCUMENT_PROCESS: Zap,
    COMPLIANCE_CHECK: Shield,
    SCHEDULE_IMPORT: Calendar,
    LOGIN: Activity,
    PROJECT_CREATE: BarChart3,
  };
  const Icon = typeIcon[item.type] ?? Activity;

  const relative = (() => {
    const diff = Date.now() - new Date(item.createdAt).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  })();

  return (
    <div className="flex items-start gap-3 border-b border-[var(--color-divider)] py-3 last:border-0">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-surface-raised)] text-[var(--color-primary)]">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">
          {item.title}
        </p>
        {item.description && (
          <p className="mt-0.5 line-clamp-1 text-xs text-[var(--color-text-secondary)]">
            {item.description}
          </p>
        )}
        <p className="mt-0.5 text-xs text-[var(--color-text-tertiary)]">
          {item.userName} · {relative}
        </p>
      </div>
    </div>
  );
}

/** Inline progress bar used in metric cards */
function MetricBar({
  value,
  color,
}: {
  value: number;
  color: string;
}) {
  return (
    <div className="h-3 rounded-full bg-[var(--color-surface-raised)]">
      <div
        className="h-3 rounded-full transition-all duration-700"
        style={{ width: `${Math.min(value, 100)}%`, background: color }}
      />
    </div>
  );
}

/** Tri-stat mini grid used in metric cards */
function MiniStatGrid({
  stats,
}: {
  stats: { label: string; value: number | string; colorClass?: string }[];
}) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map(({ label, value, colorClass }) => (
        <div
          key={label}
          className="rounded-lg border border-[var(--color-border)] p-3 text-center"
        >
          <p
            className={`text-xl font-bold ${colorClass ?? 'text-[var(--color-text-primary)]'}`}
          >
            {value}
          </p>
          <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">{label}</p>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Dashboard Content
// ---------------------------------------------------------------------------

function DashboardContent() {
  const [projects, setProjects] = useState<projectsApi.Project[]>([]);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [summary, setSummary] = useState<dashboardApi.DashboardSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load projects on mount
  useEffect(() => {
    async function loadProjects() {
      try {
        const result = await projectsApi.listProjects();
        setProjects(result.projects);
        setProjectId((cur) => cur ?? result.projects[0]?.id ?? null);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Unable to load projects');
      }
    }
    void loadProjects();
  }, []);

  const loadSummary = useCallback(
    async (pid: string, forceRefresh = false) => {
      forceRefresh ? setRefreshing(true) : setLoading(true);
      setError(null);
      try {
        const data = await dashboardApi.getDashboardSummary(pid, { refresh: forceRefresh });
        setSummary(data);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Unable to load dashboard data');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (projectId) void loadSummary(projectId);
  }, [projectId, loadSummary]);

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === projectId) ?? null,
    [projectId, projects],
  );

  const categoryEntries = useMemo(
    () =>
      summary
        ? Object.entries(summary.documents.byCategory).sort(([, a], [, b]) => b - a)
        : [],
    [summary],
  );

  // Header actions slot
  const headerActions = (
    <div className="flex items-center gap-2">
      <select
        className="h-9 min-w-44 rounded-lg border border-[var(--color-input)] bg-[var(--color-input-bg)] px-3 text-sm text-[var(--color-text-primary)] outline-none transition-colors focus:border-[var(--color-ring)] focus:ring-2 focus:ring-[var(--color-focus-ring)]"
        value={projectId ?? ''}
        onChange={(e) => setProjectId(e.target.value || null)}
      >
        {projects.length === 0 ? (
          <option value="">No projects</option>
        ) : null}
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>

      <button
        type="button"
        className="inline-flex h-9 items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface-hover)] disabled:opacity-50"
        onClick={() => projectId && void loadSummary(projectId, true)}
        disabled={refreshing || loading || !projectId}
      >
        {refreshing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <RefreshCw className="h-4 w-4" />
        )}
        Refresh
      </button>
    </div>
  );

  return (
    <AppShell
      title="Dashboard"
      subtitle={selectedProject ? `${selectedProject.name} (${selectedProject.code})` : undefined}
      headerActions={headerActions}
    >
      <div className="p-8 space-y-8">
        {/* Error banner */}
        {error && (
          <div className="rounded-lg border border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] px-4 py-3 text-sm text-[var(--color-danger-text)]">
            {error}
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex min-h-48 items-center justify-center gap-2 text-sm text-[var(--color-text-secondary)]">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading dashboard data…
          </div>
        )}

        {/* Empty state — no project */}
        {!loading && !summary && !error && (
          <div className="rounded-xl border border-dashed border-[var(--color-border)] p-12 text-center text-sm text-[var(--color-text-secondary)]">
            Select a project to view its dashboard.
          </div>
        )}

        {/* Dashboard content */}
        {summary && !loading && (
          <>
            {/* ─── Row 1: Health + Stat cards ─────────────────────── */}
            <section className="grid gap-6 lg:grid-cols-[auto_1fr]">
              {/* Health Gauge */}
              <div className="card-level-1 flex items-center justify-center p-6 transition-theme">
                <HealthGauge score={summary.healthScore} />
              </div>

              {/* Stat cards grid */}
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <StatCard
                  label="Total Documents"
                  value={summary.documents.total}
                  sub={`${summary.documents.processed} processed`}
                  icon={FileText}
                  accentClass="bg-primary-600"
                  trend={summary.documents.total > 0 ? 'up' : 'neutral'}
                />
                <StatCard
                  label="Compliance Score"
                  value={`${summary.compliance.score}%`}
                  sub={`${summary.compliance.criticalFindings} critical findings`}
                  icon={Shield}
                  accentClass={
                    summary.compliance.score >= 75
                      ? 'bg-success-600'
                      : summary.compliance.score >= 50
                      ? 'bg-warning-500'
                      : 'bg-danger-600'
                  }
                  trend={
                    summary.compliance.score >= 75
                      ? 'up'
                      : summary.compliance.score >= 50
                      ? 'neutral'
                      : 'down'
                  }
                />
                <StatCard
                  label="Schedule Risk"
                  value={`${summary.schedule.highRiskCount}`}
                  sub={`${summary.schedule.totalActivities} activities · SPI ${summary.schedule.spi.toFixed(2)}`}
                  icon={Calendar}
                  accentClass={getRiskAccent(summary.schedule.highRiskCount, 0, 5)}
                  trend={summary.schedule.highRiskCount > 5 ? 'down' : 'neutral'}
                />
                <StatCard
                  label="Procurement Risk"
                  value={`${summary.procurement.atRiskCount + summary.procurement.delayedCount}`}
                  sub={`${summary.procurement.atRiskCount} at risk, ${summary.procurement.delayedCount} delayed`}
                  icon={Package}
                  accentClass={getRiskAccent(
                    summary.procurement.atRiskCount + summary.procurement.delayedCount,
                    0,
                    3,
                  )}
                  trend={
                    (summary.procurement.atRiskCount + summary.procurement.delayedCount) > 0
                      ? 'down'
                      : 'neutral'
                  }
                />
                <StatCard
                  label="Unresolved RFIs"
                  value={summary.rfis?.open ?? 0}
                  sub={`${summary.rfis?.overdue ?? 0} overdue / ${summary.rfis?.total ?? 0} total`}
                  icon={HelpCircle}
                  accentClass={
                    (summary.rfis?.open ?? 0) === 0
                      ? 'bg-success-600'
                      : (summary.rfis?.overdue ?? 0) > 0
                      ? 'bg-danger-600'
                      : 'bg-warning-500'
                  }
                  trend={(summary.rfis?.overdue ?? 0) > 0 ? 'down' : 'neutral'}
                />
                <StatCard
                  label="Recent Activity"
                  value={summary.recentActivity.length}
                  sub="Last 20 actions"
                  icon={Activity}
                  accentClass="bg-primary-700"
                  trend="neutral"
                />
              </div>
            </section>

            {/* ─── Row 2: Document breakdown + Compliance ──────────── */}
            <section className="grid gap-6 lg:grid-cols-2">
              {/* Document breakdown */}
              <div className="card-level-1 p-6 transition-theme">
                <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-[var(--color-text-primary)]">
                  <FileText className="h-4 w-4 text-[var(--color-primary)]" />
                  Document Processing
                </h3>

                {/* Status pills */}
                <div className="mb-6 grid grid-cols-3 gap-3">
                  {[
                    {
                      label: 'Processed',
                      count: summary.documents.processed,
                      icon: CheckCircle2,
                      cls: 'status-success border',
                    },
                    {
                      label: 'Queued',
                      count: summary.documents.queued,
                      icon: Clock,
                      cls: 'status-warning border',
                    },
                    {
                      label: 'Failed',
                      count: summary.documents.failed,
                      icon: XCircle,
                      cls: 'status-danger border',
                    },
                  ].map(({ label, count, icon: Icon, cls }) => (
                    <div
                      key={label}
                      className={`flex flex-col items-center gap-1 rounded-lg p-3 ${cls}`}
                    >
                      <Icon className="h-4 w-4" />
                      <p className="text-xl font-bold">{count}</p>
                      <p className="text-xs">{label}</p>
                    </div>
                  ))}
                </div>

                {/* By category */}
                {categoryEntries.length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-tertiary)]">
                      By Category
                    </p>
                    {categoryEntries.slice(0, 6).map(([cat, count]) => (
                      <CategoryBar
                        key={cat}
                        label={cat}
                        count={count}
                        total={summary.documents.total}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[var(--color-text-tertiary)]">
                    No documents uploaded yet.
                  </p>
                )}
              </div>

              {/* Compliance summary */}
              <div className="card-level-1 p-6 transition-theme">
                <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-[var(--color-text-primary)]">
                  <Shield className="h-4 w-4 text-[var(--color-warning)]" />
                  Compliance Overview
                </h3>

                {summary.compliance.lastCheckedAt ? (
                  <>
                    <div className="mb-5">
                      <div className="mb-1 flex items-end justify-between">
                        <span className="text-sm text-[var(--color-text-secondary)]">Score</span>
                        <span className={`text-2xl font-bold ${getScoreTailwind(summary.compliance.score)}`}>
                          {summary.compliance.score}%
                        </span>
                      </div>
                      <MetricBar
                        value={summary.compliance.score}
                        color={getScoreColor(summary.compliance.score)}
                      />
                    </div>

                    <MiniStatGrid
                      stats={[
                        { label: 'Total', value: summary.compliance.totalFindings },
                        {
                          label: 'Warnings',
                          value: summary.compliance.warningFindings,
                          colorClass: 'text-[var(--color-warning-text)]',
                        },
                        {
                          label: 'Failures',
                          value: summary.compliance.criticalFindings,
                          colorClass: 'text-[var(--color-danger-text)]',
                        },
                      ]}
                    />

                    <p className="mt-4 text-xs text-[var(--color-text-tertiary)]">
                      Last checked:{' '}
                      {new Date(summary.compliance.lastCheckedAt).toLocaleString()}
                    </p>
                  </>
                ) : (
                  <div className="rounded-lg border border-dashed border-[var(--color-border)] p-6 text-center text-sm text-[var(--color-text-secondary)]">
                    No compliance checks run yet.{' '}
                    <Link href="/compliance" className="text-[var(--color-link)] underline hover:text-[var(--color-link-hover)]">
                      Run a check
                    </Link>
                  </div>
                )}
              </div>
            </section>

            {/* ─── Row 3: Schedule Risk + Procurement Pipeline ──────── */}
            <section className="grid gap-6 lg:grid-cols-2">
              {/* Schedule risk */}
              <div className="card-level-1 p-6 transition-theme">
                <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-[var(--color-text-primary)]">
                  <Calendar className="h-4 w-4 text-[var(--color-danger)]" />
                  Schedule Risk Overview
                </h3>

                {summary.schedule.totalActivities > 0 ? (
                  <>
                    <div className="mb-5">
                      <div className="mb-1 flex items-end justify-between">
                        <span className="text-sm text-[var(--color-text-secondary)]">
                          Schedule Performance Index (SPI)
                        </span>
                        <span className={`text-2xl font-bold ${getScoreTailwind(summary.schedule.spi * 100)}`}>
                          {summary.schedule.spi.toFixed(2)}
                        </span>
                      </div>
                      <MetricBar
                        value={summary.schedule.spi * 100}
                        color={getScoreColor(summary.schedule.spi * 100)}
                      />
                    </div>

                    <MiniStatGrid
                      stats={[
                        { label: 'Activities', value: summary.schedule.totalActivities },
                        {
                          label: 'Critical Path',
                          value: summary.schedule.criticalPathCount,
                          colorClass: 'text-[var(--color-warning-text)]',
                        },
                        {
                          label: 'High Risk',
                          value: summary.schedule.highRiskCount,
                          colorClass: 'text-[var(--color-danger-text)]',
                        },
                      ]}
                    />

                    {summary.schedule.lastImportedAt && (
                      <p className="mt-4 text-xs text-[var(--color-text-tertiary)]">
                        Last import:{' '}
                        {new Date(summary.schedule.lastImportedAt).toLocaleString()}
                      </p>
                    )}
                  </>
                ) : (
                  <div className="rounded-lg border border-dashed border-[var(--color-border)] p-6 text-center text-sm text-[var(--color-text-secondary)]">
                    No schedule imported yet.{' '}
                    <Link href="/schedule" className="text-[var(--color-link)] underline hover:text-[var(--color-link-hover)]">
                      Import P6 XML
                    </Link>
                  </div>
                )}
              </div>

              {/* Procurement Pipeline */}
              <div className="card-level-1 p-6 transition-theme">
                <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-[var(--color-text-primary)]">
                  <Package className="h-4 w-4 text-purple-500" />
                  Procurement Pipeline
                </h3>

                {summary.procurement.totalItems > 0 ? (
                  <>
                    <div className="mb-5">
                      <div className="mb-1 flex items-end justify-between">
                        <span className="text-sm text-[var(--color-text-secondary)]">
                          Avg Vendor Performance
                        </span>
                        <span className={`text-2xl font-bold ${getScoreTailwind(summary.procurement.overallPerformance)}`}>
                          {summary.procurement.overallPerformance}%
                        </span>
                      </div>
                      <MetricBar
                        value={summary.procurement.overallPerformance}
                        color={getScoreColor(summary.procurement.overallPerformance)}
                      />
                    </div>

                    <MiniStatGrid
                      stats={[
                        { label: 'Items', value: summary.procurement.totalItems },
                        {
                          label: 'At Risk',
                          value: summary.procurement.atRiskCount,
                          colorClass: 'text-[var(--color-warning-text)]',
                        },
                        {
                          label: 'Delayed',
                          value: summary.procurement.delayedCount,
                          colorClass: 'text-[var(--color-danger-text)]',
                        },
                      ]}
                    />

                    <div className="mt-4 text-right">
                      <Link href="/procurement" className="text-sm text-[var(--color-link)] underline hover:text-[var(--color-link-hover)]">
                        View Procurement Dashboard
                      </Link>
                    </div>
                  </>
                ) : (
                  <div className="rounded-lg border border-dashed border-[var(--color-border)] p-6 text-center text-sm text-[var(--color-text-secondary)]">
                    No procurement data imported yet.{' '}
                    <Link href="/procurement" className="text-[var(--color-link)] underline hover:text-[var(--color-link-hover)]">
                      Import Data
                    </Link>
                  </div>
                )}
              </div>
            </section>

            {/* ─── Row 4: RFIs & Activity Feed ────────────── */}
            <section className="grid gap-6 lg:grid-cols-2">
              {/* RFIs Overview Widget */}
              <div className="card-level-1 p-6 transition-theme">
                <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-[var(--color-text-primary)]">
                  <HelpCircle className="h-4 w-4 text-[var(--color-primary)]" />
                  Requests for Information (RFIs)
                </h3>

                {summary.rfis && summary.rfis.total > 0 ? (
                  <>
                    <MiniStatGrid
                      stats={[
                        { label: 'Total Raised', value: summary.rfis.total },
                        {
                          label: 'Open / In-Review',
                          value: summary.rfis.open,
                          colorClass: 'text-[var(--color-warning-text)]',
                        },
                        {
                          label: 'Overdue',
                          value: summary.rfis.overdue,
                          colorClass:
                            summary.rfis.overdue > 0
                              ? 'text-[var(--color-danger-text)]'
                              : undefined,
                        },
                      ]}
                    />
                    <div className="mt-4 text-right">
                      <Link href="/rfis" className="text-sm text-[var(--color-link)] underline hover:text-[var(--color-link-hover)]">
                        View RFI Management Dashboard
                      </Link>
                    </div>
                  </>
                ) : (
                  <div className="rounded-lg border border-dashed border-[var(--color-border)] p-6 text-center text-sm text-[var(--color-text-secondary)]">
                    No RFIs created yet.{' '}
                    <Link href="/rfis" className="text-[var(--color-link)] underline hover:text-[var(--color-link-hover)]">
                      Create an RFI
                    </Link>
                  </div>
                )}
              </div>

              {/* Activity feed */}
              <div className="card-level-1 p-6 transition-theme">
                <h3 className="mb-2 flex items-center gap-2 text-base font-semibold text-[var(--color-text-primary)]">
                  <Activity className="h-4 w-4 text-primary-600" />
                  Recent Activity
                </h3>

                {summary.recentActivity.length > 0 ? (
                  <>
                    <div className="scrollbar-thin max-h-72 overflow-y-auto">
                      {summary.recentActivity.map((item) => (
                        <ActivityItem key={item.id} item={item} />
                      ))}
                    </div>
                    <div className="mt-4 text-right">
                      <Link
                        href="/activity"
                        className="text-xs font-semibold text-[var(--color-link)] underline hover:text-[var(--color-link-hover)]"
                      >
                        View Full Activity Timeline
                      </Link>
                    </div>
                  </>
                ) : (
                  <div className="rounded-lg border border-dashed border-[var(--color-border)] p-6 text-center text-sm text-[var(--color-text-secondary)]">
                    No activity recorded yet.
                  </div>
                )}
              </div>
            </section>

            {/* Last updated */}
            <p className="text-right text-xs text-[var(--color-text-tertiary)]">
              Dashboard generated at {new Date(summary.generatedAt).toLocaleString()}
            </p>
          </>
        )}
      </div>
    </AppShell>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}