'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  LayoutDashboard,
  FileText,
  Search,
  Bot,
  AlertTriangle,
  Package,
  Settings,
  HelpCircle,
  Activity,
  RefreshCw,
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  BarChart3,
  Shield,
  Zap,
  Network,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import * as projectsApi from '@/lib/api/projects';
import * as dashboardApi from '@/lib/api/dashboard';
import { ApiError } from '@/lib/api';

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Documents', href: '/documents', icon: FileText },
  { name: 'Search', href: '/search', icon: Search },
  { name: 'Chat', href: '/chat', icon: Bot },
  { name: 'Compliance', href: '/compliance', icon: Shield },
  { name: 'Schedule', href: '/schedule', icon: Calendar },
  { name: 'Procurement', href: '/procurement', icon: Package },
  { name: 'RFIs', href: '/rfis', icon: HelpCircle },
  { name: 'Agents', href: '/agents', icon: Bot },
  { name: 'Knowledge Graph', href: '/graph', icon: Network },
  { name: 'Settings', href: '/settings', icon: Settings },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Circular health score gauge rendered via SVG */
function HealthGauge({ score }: { score: number }) {
  const radius = 54;
  const stroke = 10;
  const circumference = 2 * Math.PI * radius;
  const filled = (score / 100) * circumference;

  const color =
    score >= 75
      ? '#22c55e'   // green
      : score >= 50
      ? '#f59e0b'   // amber
      : '#ef4444';  // red

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={130} height={130} viewBox="0 0 130 130">
        {/* Background ring */}
        <circle
          cx={65}
          cy={65}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
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
        {/* Score text */}
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
        <text
          x={65}
          y={82}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={11}
          fill="#6b7280"
        >
          / 100
        </text>
      </svg>
      <span className="text-sm font-medium text-gray-600">Project Health</span>
    </div>
  );
}

/** Single stat card */
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
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor =
    trend === 'up'
      ? 'text-green-600'
      : trend === 'down'
      ? 'text-red-500'
      : 'text-gray-400';

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm flex flex-col gap-3">
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
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

/** Simple horizontal bar for category breakdown */
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
      <span className="w-32 truncate text-xs text-gray-600 capitalize">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-gray-100">
        <div
          className="h-2 rounded-full bg-blue-500 transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-8 text-right text-xs font-medium text-gray-700">{count}</span>
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
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
        <Icon className="h-4 w-4" />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
        {item.description && (
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{item.description}</p>
        )}
        <p className="text-xs text-gray-400 mt-0.5">
          {item.userName} · {relative}
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  const pathname = usePathname();

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

  // Load summary when projectId changes
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

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex h-screen overflow-hidden">
          {/* Sidebar */}
          <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <LayoutDashboard className="w-5 h-5 text-white" />
                </span>
                DCBrain
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                AI Platform for Data Centre EPC
              </p>
            </div>

            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {navigation.map((item) => {
                const active =
                  item.href === '/'
                    ? pathname === '/'
                    : pathname.startsWith(item.href);
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

            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <Link
                href="/help"
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <HelpCircle className="w-5 h-5" />
                Help &amp; Docs
              </Link>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 overflow-y-auto">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-8 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Dashboard
                  </h2>
                  {selectedProject && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedProject.name} ({selectedProject.code})
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {/* Project selector */}
                  <select
                    className="h-9 min-w-48 rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
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

                  {/* Refresh */}
                  <button
                    type="button"
                    className="inline-flex h-9 items-center gap-2 rounded-lg border border-gray-300 px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
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
              </div>
            </header>

            <div className="p-8 space-y-8">
              {/* Error banner */}
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* Loading state */}
              {loading && (
                <div className="flex min-h-48 items-center justify-center text-sm text-gray-500">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Loading dashboard data…
                </div>
              )}

              {/* Empty state — no project */}
              {!loading && !summary && !error && (
                <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center text-sm text-gray-500">
                  Select a project to view its dashboard.
                </div>
              )}

              {/* Dashboard content */}
              {summary && !loading && (
                <>
                  {/* ─── Row 1: Health + Stat cards ─────────────────────── */}
                  <section className="grid gap-6 lg:grid-cols-[auto_1fr]">
                    {/* Health Gauge */}
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm flex items-center justify-center">
                      <HealthGauge score={summary.healthScore} />
                    </div>

                    {/* Stat cards grid */}
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                      <StatCard
                        label="Total Documents"
                        value={summary.documents.total}
                        sub={`${summary.documents.processed} processed`}
                        icon={FileText}
                        accentClass="bg-blue-600"
                        trend={summary.documents.total > 0 ? 'up' : 'neutral'}
                      />
                      <StatCard
                        label="Compliance Score"
                        value={`${summary.compliance.score}%`}
                        sub={`${summary.compliance.criticalFindings} critical findings`}
                        icon={Shield}
                        accentClass={
                          summary.compliance.score >= 75
                            ? 'bg-green-600'
                            : summary.compliance.score >= 50
                            ? 'bg-amber-500'
                            : 'bg-red-600'
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
                        accentClass={
                          summary.schedule.highRiskCount === 0
                            ? 'bg-green-600'
                            : summary.schedule.highRiskCount <= 5
                            ? 'bg-amber-500'
                            : 'bg-red-600'
                        }
                        trend={summary.schedule.highRiskCount > 5 ? 'down' : 'neutral'}
                      />
                      <StatCard
                        label="Procurement Risk"
                        value={`${summary.procurement.atRiskCount + summary.procurement.delayedCount}`}
                        sub={`${summary.procurement.atRiskCount} at risk, ${summary.procurement.delayedCount} delayed`}
                        icon={Package}
                        accentClass={
                          (summary.procurement.atRiskCount + summary.procurement.delayedCount) === 0
                            ? 'bg-green-600'
                            : (summary.procurement.atRiskCount + summary.procurement.delayedCount) <= 3
                            ? 'bg-amber-500'
                            : 'bg-red-600'
                        }
                        trend={(summary.procurement.atRiskCount + summary.procurement.delayedCount) > 0 ? 'down' : 'neutral'}
                      />
                      <StatCard
                        label="Unresolved RFIs"
                        value={summary.rfis?.open ?? 0}
                        sub={`${summary.rfis?.overdue ?? 0} overdue / ${summary.rfis?.total ?? 0} total`}
                        icon={HelpCircle}
                        accentClass={
                          (summary.rfis?.open ?? 0) === 0
                            ? 'bg-green-600'
                            : (summary.rfis?.overdue ?? 0) > 0
                            ? 'bg-red-600'
                            : 'bg-amber-500'
                        }
                        trend={(summary.rfis?.overdue ?? 0) > 0 ? 'down' : 'neutral'}
                      />
                      <StatCard
                        label="Recent Activities"
                        value={summary.recentActivity.length}
                        sub="Last 20 actions"
                        icon={Activity}
                        accentClass="bg-indigo-600"
                        trend="neutral"
                      />
                    </div>
                  </section>

                  {/* ─── Row 2: Document breakdown + Compliance ──────────── */}
                  <section className="grid gap-6 lg:grid-cols-2">
                    {/* Document breakdown */}
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                      <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-600" />
                        Document Processing
                      </h3>

                      {/* Status pills */}
                      <div className="grid grid-cols-3 gap-3 mb-6">
                        {[
                          {
                            label: 'Processed',
                            count: summary.documents.processed,
                            icon: CheckCircle2,
                            cls: 'text-green-700 bg-green-50 border-green-200',
                          },
                          {
                            label: 'Queued',
                            count: summary.documents.queued,
                            icon: Clock,
                            cls: 'text-amber-700 bg-amber-50 border-amber-200',
                          },
                          {
                            label: 'Failed',
                            count: summary.documents.failed,
                            icon: XCircle,
                            cls: 'text-red-700 bg-red-50 border-red-200',
                          },
                        ].map(({ label, count, icon: Icon, cls }) => (
                          <div
                            key={label}
                            className={`rounded-lg border p-3 flex flex-col items-center gap-1 ${cls}`}
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
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
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
                        <p className="text-sm text-gray-400">No documents uploaded yet.</p>
                      )}
                    </div>

                    {/* Compliance summary */}
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                      <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Shield className="h-4 w-4 text-amber-600" />
                        Compliance Overview
                      </h3>

                      {summary.compliance.lastCheckedAt ? (
                        <>
                          {/* Score meter */}
                          <div className="mb-5">
                            <div className="flex items-end justify-between mb-1">
                              <span className="text-sm text-gray-500">Score</span>
                              <span className="text-2xl font-bold text-gray-900">
                                {summary.compliance.score}%
                              </span>
                            </div>
                            <div className="h-3 rounded-full bg-gray-100">
                              <div
                                className="h-3 rounded-full transition-all duration-700"
                                style={{
                                  width: `${summary.compliance.score}%`,
                                  background:
                                    summary.compliance.score >= 75
                                      ? '#22c55e'
                                      : summary.compliance.score >= 50
                                      ? '#f59e0b'
                                      : '#ef4444',
                                }}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-3">
                            {[
                              {
                                label: 'Total',
                                value: summary.compliance.totalFindings,
                                cls: 'text-gray-900',
                              },
                              {
                                label: 'Warnings',
                                value: summary.compliance.warningFindings,
                                cls: 'text-amber-700',
                              },
                              {
                                label: 'Failures',
                                value: summary.compliance.criticalFindings,
                                cls: 'text-red-700',
                              },
                            ].map(({ label, value, cls }) => (
                              <div
                                key={label}
                                className="rounded-lg border border-gray-200 p-3 text-center"
                              >
                                <p className={`text-xl font-bold ${cls}`}>{value}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                              </div>
                            ))}
                          </div>

                          <p className="mt-4 text-xs text-gray-400">
                            Last checked:{' '}
                            {new Date(summary.compliance.lastCheckedAt).toLocaleString()}
                          </p>
                        </>
                      ) : (
                        <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
                          No compliance checks run yet.{' '}
                          <Link href="/compliance" className="text-blue-600 underline">
                            Run a check
                          </Link>
                        </div>
                      )}
                    </div>
                  </section>

                  {/* ─── Row 3: Schedule Risk + Activity Feed ────────────── */}
                  <section className="grid gap-6 lg:grid-cols-2">
                    {/* Schedule risk */}
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                      <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-rose-600" />
                        Schedule Risk Overview
                      </h3>

                      {summary.schedule.totalActivities > 0 ? (
                        <>
                          {/* SPI */}
                          <div className="mb-5">
                            <div className="flex items-end justify-between mb-1">
                              <span className="text-sm text-gray-500">
                                Schedule Performance Index (SPI)
                              </span>
                              <span
                                className={`text-2xl font-bold ${
                                  summary.schedule.spi >= 0.9
                                    ? 'text-green-600'
                                    : summary.schedule.spi >= 0.75
                                    ? 'text-amber-600'
                                    : 'text-red-600'
                                }`}
                              >
                                {summary.schedule.spi.toFixed(2)}
                              </span>
                            </div>
                            <div className="h-3 rounded-full bg-gray-100">
                              <div
                                className="h-3 rounded-full transition-all duration-700"
                                style={{
                                  width: `${Math.min(summary.schedule.spi * 100, 100)}%`,
                                  background:
                                    summary.schedule.spi >= 0.9
                                      ? '#22c55e'
                                      : summary.schedule.spi >= 0.75
                                      ? '#f59e0b'
                                      : '#ef4444',
                                }}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-3">
                            {[
                              {
                                label: 'Activities',
                                value: summary.schedule.totalActivities,
                                cls: 'text-gray-900',
                              },
                              {
                                label: 'Critical Path',
                                value: summary.schedule.criticalPathCount,
                                cls: 'text-amber-700',
                              },
                              {
                                label: 'High Risk',
                                value: summary.schedule.highRiskCount,
                                cls: 'text-red-700',
                              },
                            ].map(({ label, value, cls }) => (
                              <div
                                key={label}
                                className="rounded-lg border border-gray-200 p-3 text-center"
                              >
                                <p className={`text-xl font-bold ${cls}`}>{value}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                              </div>
                            ))}
                          </div>

                          {summary.schedule.lastImportedAt && (
                            <p className="mt-4 text-xs text-gray-400">
                              Last import:{' '}
                              {new Date(summary.schedule.lastImportedAt).toLocaleString()}
                            </p>
                          )}
                        </>
                      ) : (
                        <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
                          No schedule imported yet.{' '}
                          <Link href="/schedule" className="text-blue-600 underline">
                            Import P6 XML
                          </Link>
                        </div>
                      )}
                    </div>

                    {/* Procurement Risk */}
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                      <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Package className="h-4 w-4 text-purple-600" />
                        Procurement Pipeline
                      </h3>

                      {summary.procurement.totalItems > 0 ? (
                        <>
                          {/* Vendor Score */}
                          <div className="mb-5">
                            <div className="flex items-end justify-between mb-1">
                              <span className="text-sm text-gray-500">
                                Avg Vendor Performance
                              </span>
                              <span
                                className={`text-2xl font-bold ${
                                  summary.procurement.overallPerformance >= 90
                                    ? 'text-green-600'
                                    : summary.procurement.overallPerformance >= 70
                                    ? 'text-amber-600'
                                    : 'text-red-600'
                                }`}
                              >
                                {summary.procurement.overallPerformance}%
                              </span>
                            </div>
                            <div className="h-3 rounded-full bg-gray-100">
                              <div
                                className="h-3 rounded-full transition-all duration-700"
                                style={{
                                  width: `${Math.min(summary.procurement.overallPerformance, 100)}%`,
                                  background:
                                    summary.procurement.overallPerformance >= 90
                                      ? '#22c55e'
                                      : summary.procurement.overallPerformance >= 70
                                      ? '#f59e0b'
                                      : '#ef4444',
                                }}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-3">
                            {[
                              {
                                label: 'Items',
                                value: summary.procurement.totalItems,
                                cls: 'text-gray-900',
                              },
                              {
                                label: 'At Risk',
                                value: summary.procurement.atRiskCount,
                                cls: 'text-amber-700',
                              },
                              {
                                label: 'Delayed',
                                value: summary.procurement.delayedCount,
                                cls: 'text-red-700',
                              },
                            ].map(({ label, value, cls }) => (
                              <div
                                key={label}
                                className="rounded-lg border border-gray-200 p-3 text-center"
                              >
                                <p className={`text-xl font-bold ${cls}`}>{value}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                              </div>
                            ))}
                          </div>
                          
                          <div className="mt-4 text-right">
                             <Link href="/procurement" className="text-blue-600 underline text-sm">
                              View Procurement Dashboard
                            </Link>
                          </div>
                        </>
                      ) : (
                        <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
                          No procurement data imported yet.{' '}
                          <Link href="/procurement" className="text-blue-600 underline">
                            Import Data
                          </Link>
                        </div>
                      )}
                    </div>
                  </section>

                  {/* ─── Row 4: RFIs & Activity Feed ────────────── */}
                  <section className="grid gap-6 lg:grid-cols-2">
                    {/* RFIs Overview Widget */}
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                      <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <HelpCircle className="h-4 w-4 text-blue-600" />
                        Requests for Information (RFIs)
                      </h3>

                      {summary.rfis && summary.rfis.total > 0 ? (
                        <>
                          <div className="grid grid-cols-3 gap-3 mb-5">
                            {[
                              {
                                label: 'Total Raised',
                                value: summary.rfis.total,
                                cls: 'text-gray-900',
                              },
                              {
                                label: 'Open / In-Review',
                                value: summary.rfis.open,
                                cls: 'text-amber-600',
                              },
                              {
                                label: 'Overdue',
                                value: summary.rfis.overdue,
                                cls: summary.rfis.overdue > 0 ? 'text-red-600' : 'text-gray-900',
                              },
                            ].map(({ label, value, cls }) => (
                              <div
                                key={label}
                                className="rounded-lg border border-gray-200 p-3 text-center"
                              >
                                <p className={`text-xl font-bold ${cls}`}>{value}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                              </div>
                            ))}
                          </div>
                          <div className="mt-4 text-right">
                             <Link href="/rfis" className="text-blue-600 underline text-sm">
                              View RFI Management Dashboard
                            </Link>
                          </div>
                        </>
                      ) : (
                        <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
                          No RFIs created yet.{' '}
                          <Link href="/rfis" className="text-blue-600 underline">
                            Create an RFI
                          </Link>
                        </div>
                      )}
                    </div>

                    {/* Activity feed */}
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                      <h3 className="text-base font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <Activity className="h-4 w-4 text-indigo-600" />
                        Recent Activity
                      </h3>

                      {summary.recentActivity.length > 0 ? (
                        <div className="overflow-y-auto max-h-72">
                          {summary.recentActivity.map((item) => (
                            <ActivityItem key={item.id} item={item} />
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
                          No activity recorded yet.
                        </div>
                      )}
                    </div>
                  </section>

                  {/* Last updated */}
                  <p className="text-xs text-gray-400 text-right">
                    Dashboard generated at{' '}
                    {new Date(summary.generatedAt).toLocaleString()}
                  </p>
                </>
              )}
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}