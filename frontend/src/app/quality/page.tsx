'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  LayoutDashboard, FileText, Search, Bot, Shield, Calendar,
  Package, Activity, HelpCircle, Settings, Network, BarChart3,
  AlertOctagon, ClipboardList, RefreshCw, CheckCircle, Zap, GitPullRequest,
  Loader2, TrendingUp, TrendingDown, Minus,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import * as projectsApi from '@/lib/api/projects';
import * as qualityApi from '@/lib/api/quality';

/** Circular gauge rendered via SVG */
function QualityGauge({ score, label, color }: { score: number; label: string; color: string }) {
  const radius = 40;
  const stroke = 8;
  const circumference = 2 * Math.PI * radius;
  const filled = (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={100} height={100} viewBox="0 0 100 100">
        <circle cx={50} cy={50} r={radius} fill="none" stroke="var(--color-divider)" strokeWidth={stroke} />
        <circle
          cx={50} cy={50} r={radius} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={`${filled} ${circumference - filled}`}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
          style={{ transition: 'stroke-dasharray 1s ease' }}
        />
        <text x={50} y={54} textAnchor="middle" fill="var(--color-text-primary)" fontSize={18} fontWeight="bold">
          {score}
        </text>
      </svg>
      <span className="text-xs text-[var(--color-text-secondary)]">{label}</span>
    </div>
  );
}

function RadialBar({ value, max, label, color }: { value: number; max: number; label: string; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-xs text-[var(--color-text-secondary)]">{label}</span>
        <span className="text-xs text-[var(--color-text-primary)]">{value} / {max}</span>
      </div>
      <div className="h-2 bg-[var(--color-surface-hover)] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function ScoreCard({ title, value, unit, icon: Icon, color, trend }: {
  title: string; value: number | string; unit?: string; icon: React.ElementType; color: string; trend?: 'up' | 'down' | 'neutral';
}) {
  return (
    <div className="card-level-1 p-5 flex items-start justify-between transition-theme">
      <div>
        <p className="text-xs text-[var(--color-text-secondary)] mb-1">{title}</p>
        <p className="text-3xl font-bold" style={{ color }}>{value}{unit && <span className="text-lg ml-1 text-[var(--color-text-tertiary)]">{unit}</span>}</p>
      </div>
      <div className="flex flex-col items-end gap-1">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
          <Icon size={20} style={{ color }} />
        </div>
        {trend && (
          <div className="flex items-center gap-1 text-xs">
            {trend === 'up' && <TrendingUp size={12} className="text-[var(--color-success)]" />}
            {trend === 'down' && <TrendingDown size={12} className="text-[var(--color-danger)]" />}
            {trend === 'neutral' && <Minus size={12} className="text-[var(--color-text-tertiary)]" />}
          </div>
        )}
      </div>
    </div>
  );
}

function QualityPageContent() {
  const pathname = usePathname();
  const [projects, setProjects] = useState<projectsApi.Project[]>([]);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [data, setData] = useState<qualityApi.QualitySummaryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    projectsApi.listProjects().then((res) => {
      setProjects(res.projects);
      if (res.projects.length > 0) setProjectId(res.projects[0].id);
    }).catch(() => {});
  }, []);

  const fetchData = useCallback(async () => {
    if (!projectId) return;
    setLoading(true); setError('');
    try {
      const q = await qualityApi.getQualitySummary(projectId);
      setData(q);
    } catch (e) {
      setError('Failed to load quality data');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  const scoreColor = data
    ? data.qualityScore >= 75 ? 'var(--color-success)' : data.qualityScore >= 50 ? 'var(--color-warning)' : 'var(--color-danger)'
    : 'var(--color-text-tertiary)';

  const headerActions = (
    <div className="flex items-center gap-3">
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
      <button onClick={() => void fetchData()} className="inline-flex h-9 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]">
        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
      </button>
    </div>
  );

  return (
    <AppShell
      title="Quality Dashboard"
      subtitle="Composite quality score from NCRs, Inspections & Commissioning"
      headerActions={headerActions}
    >
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={36} className="animate-spin text-[var(--color-primary)]" />
            </div>
          )}
          {error && (
            <div className="text-center py-10 text-[var(--color-danger-text)]">{error}</div>
          )}
          {!loading && data && (
            <>
              {/* Quality Score Hero */}
              <div className="card-level-2 border border-[var(--color-border)] rounded-2xl p-8 transition-theme">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-1">Overall Quality Score</h2>
                    <p className="text-sm text-[var(--color-text-secondary)]">Weighted composite of NCR health (25%), Inspection pass rate (40%), Commissioning pass rate (35%)</p>
                    <div className="mt-6">
                      <div className="text-8xl font-black" style={{ color: scoreColor }}>{data.qualityScore}</div>
                      <div className="text-sm text-[var(--color-text-tertiary)] mt-1">out of 100</div>
                      <div className="mt-3">
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${
                          data.qualityScore >= 75 ? 'status-success border' :
                          data.qualityScore >= 50 ? 'status-warning border' :
                          'status-danger border'
                        }`}>
                          {data.qualityScore >= 75 ? '✓ Good' : data.qualityScore >= 50 ? '⚠ Fair' : '✗ Needs Attention'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-10">
                    <QualityGauge score={data.ncr.healthScore} label="NCR Health" color="var(--color-primary)" />
                    <QualityGauge score={data.inspection.passRate} label="Inspection Pass" color="var(--color-info)" />
                    <QualityGauge score={data.commissioning.passRate} label="Cx Pass Rate" color="var(--color-warning)" />
                  </div>
                </div>
              </div>

              {/* Metric Cards */}
              <div className="grid grid-cols-3 gap-4">
                <ScoreCard title="NCR Health Score" value={data.ncr.healthScore} unit="/100" icon={AlertOctagon} color="var(--color-primary)" />
                <ScoreCard title="Inspection Pass Rate" value={`${data.inspection.passRate}%`} icon={ClipboardList} color="var(--color-info)" />
                <ScoreCard title="Commissioning Pass Rate" value={`${data.commissioning.passRate}%`} icon={Zap} color="var(--color-warning)" />
              </div>

              {/* Breakdown */}
              <div className="grid grid-cols-3 gap-6">
                {/* NCR Breakdown */}
                <div className="card-level-1 p-5 space-y-4 transition-theme">
                  <div className="flex items-center gap-2">
                    <AlertOctagon size={16} className="text-[var(--color-primary)]" />
                    <h3 className="font-medium text-[var(--color-text-primary)] text-sm">NCR Breakdown</h3>
                  </div>
                  <div className="space-y-3">
                    <RadialBar value={data.ncr.bySeverity.CRITICAL} max={data.ncr.total || 1} label="Critical" color="var(--color-danger)" />
                    <RadialBar value={data.ncr.bySeverity.MAJOR} max={data.ncr.total || 1} label="Major" color="var(--color-warning)" />
                    <RadialBar value={data.ncr.bySeverity.MINOR} max={data.ncr.total || 1} label="Minor" color="var(--color-info)" />
                  </div>
                  <div className="pt-2 border-t border-[var(--color-divider)]">
                    <div className="flex justify-between text-xs">
                      <span className="text-[var(--color-text-secondary)]">Open NCRs</span>
                      <span className="text-[var(--color-danger)] font-medium">{data.ncr.open}</span>
                    </div>
                    <div className="flex justify-between text-xs mt-1">
                      <span className="text-[var(--color-text-secondary)]">Total NCRs</span>
                      <span className="text-[var(--color-text-primary)]">{data.ncr.total}</span>
                    </div>
                  </div>
                  <Link href="/ncrs" className="block text-center text-xs text-[var(--color-primary)] hover:opacity-80 transition-opacity">View NCRs →</Link>
                </div>

                {/* Inspection Breakdown */}
                <div className="card-level-1 p-5 space-y-4 transition-theme">
                  <div className="flex items-center gap-2">
                    <ClipboardList size={16} className="text-[var(--color-info)]" />
                    <h3 className="font-medium text-[var(--color-text-primary)] text-sm">Inspection Breakdown</h3>
                  </div>
                  <div className="space-y-3">
                    <RadialBar value={data.inspection.passed} max={data.inspection.total || 1} label="Passed" color="var(--color-success)" />
                    <RadialBar value={data.inspection.failed} max={data.inspection.total || 1} label="Failed" color="var(--color-danger)" />
                    <RadialBar
                      value={data.inspection.total - data.inspection.passed - data.inspection.failed}
                      max={data.inspection.total || 1}
                      label="In Progress / Other"
                      color="var(--color-primary)"
                    />
                  </div>
                  <div className="pt-2 border-t border-[var(--color-divider)]">
                    <div className="flex justify-between text-xs">
                      <span className="text-[var(--color-text-secondary)]">Total Inspections</span>
                      <span className="text-[var(--color-text-primary)]">{data.inspection.total}</span>
                    </div>
                    <div className="flex justify-between text-xs mt-1">
                      <span className="text-[var(--color-text-secondary)]">Pass Rate</span>
                      <span className="text-[var(--color-success)] font-medium">{data.inspection.passRate}%</span>
                    </div>
                  </div>
                  <Link href="/inspections" className="block text-center text-xs text-[var(--color-info)] hover:opacity-80 transition-opacity">View Inspections →</Link>
                </div>

                {/* Commissioning Breakdown */}
                <div className="card-level-1 p-5 space-y-4 transition-theme">
                  <div className="flex items-center gap-2">
                    <Zap size={16} className="text-[var(--color-warning)]" />
                    <h3 className="font-medium text-[var(--color-text-primary)] text-sm">Commissioning Breakdown</h3>
                  </div>
                  <div className="space-y-3">
                    <RadialBar value={data.commissioning.passed} max={data.commissioning.total || 1} label="Passed/Closed" color="var(--color-success)" />
                    <RadialBar value={data.commissioning.failed} max={data.commissioning.total || 1} label="Failed" color="var(--color-danger)" />
                    <RadialBar
                      value={data.commissioning.total - data.commissioning.passed - data.commissioning.failed}
                      max={data.commissioning.total || 1}
                      label="Not Started / In Progress"
                      color="var(--color-primary)"
                    />
                  </div>
                  <div className="pt-2 border-t border-[var(--color-divider)]">
                    <div className="flex justify-between text-xs">
                      <span className="text-[var(--color-text-secondary)]">Total Records</span>
                      <span className="text-[var(--color-text-primary)]">{data.commissioning.total}</span>
                    </div>
                    <div className="flex justify-between text-xs mt-1">
                      <span className="text-[var(--color-text-secondary)]">Pass Rate</span>
                      <span className="text-[var(--color-success)] font-medium">{data.commissioning.passRate}%</span>
                    </div>
                  </div>
                  <Link href="/commissioning" className="block text-center text-xs text-[var(--color-warning)] hover:opacity-80 transition-opacity">View Commissioning →</Link>
                </div>
              </div>

              <p className="text-xs text-[var(--color-text-tertiary)] text-center">
                Generated {new Date(data.generatedAt).toLocaleString()}
              </p>
            </>
          )}
          {!loading && !data && !error && (
            <div className="text-center py-20 text-[var(--color-text-tertiary)]">
              <CheckCircle size={48} className="mx-auto mb-4 opacity-30" />
              <p>Select a project to view quality metrics</p>
            </div>
          )}
        </div>
    </AppShell>
  );
}

export default function QualityPage() {
  return <ProtectedRoute><QualityPageContent /></ProtectedRoute>;
}
