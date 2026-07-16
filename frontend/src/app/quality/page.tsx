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
import * as projectsApi from '@/lib/api/projects';
import * as qualityApi from '@/lib/api/quality';

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
  { name: 'NCRs', href: '/ncrs', icon: AlertOctagon },
  { name: 'Inspections', href: '/inspections', icon: ClipboardList },
  { name: 'Commissioning', href: '/commissioning', icon: Zap },
  { name: 'Change Orders', href: '/change-orders', icon: GitPullRequest },
  { name: 'Quality', href: '/quality', icon: CheckCircle },
  { name: 'Agents', href: '/agents', icon: Bot },
  { name: 'Knowledge Graph', href: '/graph', icon: Network },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

/** Circular gauge rendered via SVG */
function QualityGauge({ score, label, color }: { score: number; label: string; color: string }) {
  const radius = 40;
  const stroke = 8;
  const circumference = 2 * Math.PI * radius;
  const filled = (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={100} height={100} viewBox="0 0 100 100">
        <circle cx={50} cy={50} r={radius} fill="none" stroke="#1f2937" strokeWidth={stroke} />
        <circle
          cx={50} cy={50} r={radius} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={`${filled} ${circumference - filled}`}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
          style={{ transition: 'stroke-dasharray 1s ease' }}
        />
        <text x={50} y={54} textAnchor="middle" fill="white" fontSize={18} fontWeight="bold">
          {score}
        </text>
      </svg>
      <span className="text-xs text-white/50">{label}</span>
    </div>
  );
}

function RadialBar({ value, max, label, color }: { value: number; max: number; label: string; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-xs text-white/50">{label}</span>
        <span className="text-xs text-white/70">{value} / {max}</span>
      </div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function ScoreCard({ title, value, unit, icon: Icon, color, trend }: {
  title: string; value: number | string; unit?: string; icon: React.ElementType; color: string; trend?: 'up' | 'down' | 'neutral';
}) {
  return (
    <div className="bg-[#111118] border border-white/5 rounded-xl p-5 flex items-start justify-between">
      <div>
        <p className="text-xs text-white/40 mb-1">{title}</p>
        <p className="text-3xl font-bold" style={{ color }}>{value}{unit && <span className="text-lg ml-1 text-white/40">{unit}</span>}</p>
      </div>
      <div className="flex flex-col items-end gap-1">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
          <Icon size={20} style={{ color }} />
        </div>
        {trend && (
          <div className="flex items-center gap-1 text-xs">
            {trend === 'up' && <TrendingUp size={12} className="text-green-400" />}
            {trend === 'down' && <TrendingDown size={12} className="text-red-400" />}
            {trend === 'neutral' && <Minus size={12} className="text-white/30" />}
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
    ? data.qualityScore >= 75 ? '#22c55e' : data.qualityScore >= 50 ? '#f59e0b' : '#ef4444'
    : '#6b7280';

  return (
    <div className="flex h-screen bg-[#0a0a0f] text-white overflow-hidden">
      <aside className="w-64 flex-shrink-0 bg-[#111118] border-r border-white/5 flex flex-col">
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">DC</span>
            </div>
            <div>
              <h1 className="font-bold text-sm text-white">DCBrain</h1>
              <p className="text-xs text-white/40">EPC Intelligence</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const active = pathname === item.href;
            return (
              <Link key={item.name} href={item.href} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${active ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30' : 'text-white/50 hover:text-white hover:bg-white/5'}`}>
                <item.icon size={16} />{item.name}
              </Link>
            );
          })}
        </nav>
        {projects.length > 1 && (
          <div className="p-4 border-t border-white/5">
            <label className="text-xs text-white/40 mb-2 block">Project</label>
            <select value={projectId ?? ''} onChange={(e) => setProjectId(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white">
              {projects.map((p) => <option key={p.id} value={p.id} className="bg-[#111118]">{p.name}</option>)}
            </select>
          </div>
        )}
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="border-b border-white/5 bg-[#111118]/50 backdrop-blur-xl px-8 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <CheckCircle size={22} className="text-green-400" />
              Quality Dashboard
            </h1>
            <p className="text-sm text-white/40 mt-0.5">
              Composite quality score from NCRs, Inspections &amp; Commissioning
            </p>
          </div>
          <button onClick={() => void fetchData()} className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-all">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={36} className="animate-spin text-green-400" />
            </div>
          )}
          {error && (
            <div className="text-center py-10 text-red-400">{error}</div>
          )}
          {!loading && data && (
            <>
              {/* Quality Score Hero */}
              <div className="bg-gradient-to-br from-[#111118] to-[#0f0f1a] border border-white/5 rounded-2xl p-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-white mb-1">Overall Quality Score</h2>
                    <p className="text-sm text-white/40">Weighted composite of NCR health (25%), Inspection pass rate (40%), Commissioning pass rate (35%)</p>
                    <div className="mt-6">
                      <div className="text-8xl font-black" style={{ color: scoreColor }}>{data.qualityScore}</div>
                      <div className="text-sm text-white/40 mt-1">out of 100</div>
                      <div className="mt-3">
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${
                          data.qualityScore >= 75 ? 'bg-green-500/20 text-green-300 border-green-500/30' :
                          data.qualityScore >= 50 ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' :
                          'bg-red-500/20 text-red-300 border-red-500/30'
                        }`}>
                          {data.qualityScore >= 75 ? '✓ Good' : data.qualityScore >= 50 ? '⚠ Fair' : '✗ Needs Attention'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-10">
                    <QualityGauge score={data.ncr.healthScore} label="NCR Health" color="#a78bfa" />
                    <QualityGauge score={data.inspection.passRate} label="Inspection Pass" color="#22d3ee" />
                    <QualityGauge score={data.commissioning.passRate} label="Cx Pass Rate" color="#fbbf24" />
                  </div>
                </div>
              </div>

              {/* Metric Cards */}
              <div className="grid grid-cols-3 gap-4">
                <ScoreCard title="NCR Health Score" value={data.ncr.healthScore} unit="/100" icon={AlertOctagon} color="#a78bfa" />
                <ScoreCard title="Inspection Pass Rate" value={`${data.inspection.passRate}%`} icon={ClipboardList} color="#22d3ee" />
                <ScoreCard title="Commissioning Pass Rate" value={`${data.commissioning.passRate}%`} icon={Zap} color="#fbbf24" />
              </div>

              {/* Breakdown */}
              <div className="grid grid-cols-3 gap-6">
                {/* NCR Breakdown */}
                <div className="bg-[#111118] border border-white/5 rounded-xl p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <AlertOctagon size={16} className="text-violet-400" />
                    <h3 className="font-medium text-white text-sm">NCR Breakdown</h3>
                  </div>
                  <div className="space-y-3">
                    <RadialBar value={data.ncr.bySeverity.CRITICAL} max={data.ncr.total || 1} label="Critical" color="#ef4444" />
                    <RadialBar value={data.ncr.bySeverity.MAJOR} max={data.ncr.total || 1} label="Major" color="#f97316" />
                    <RadialBar value={data.ncr.bySeverity.MINOR} max={data.ncr.total || 1} label="Minor" color="#eab308" />
                  </div>
                  <div className="pt-2 border-t border-white/5">
                    <div className="flex justify-between text-xs">
                      <span className="text-white/40">Open NCRs</span>
                      <span className="text-red-400 font-medium">{data.ncr.open}</span>
                    </div>
                    <div className="flex justify-between text-xs mt-1">
                      <span className="text-white/40">Total NCRs</span>
                      <span className="text-white/70">{data.ncr.total}</span>
                    </div>
                  </div>
                  <Link href="/ncrs" className="block text-center text-xs text-violet-400 hover:text-violet-300 transition-colors">View NCRs →</Link>
                </div>

                {/* Inspection Breakdown */}
                <div className="bg-[#111118] border border-white/5 rounded-xl p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <ClipboardList size={16} className="text-cyan-400" />
                    <h3 className="font-medium text-white text-sm">Inspection Breakdown</h3>
                  </div>
                  <div className="space-y-3">
                    <RadialBar value={data.inspection.passed} max={data.inspection.total || 1} label="Passed" color="#22c55e" />
                    <RadialBar value={data.inspection.failed} max={data.inspection.total || 1} label="Failed" color="#ef4444" />
                    <RadialBar
                      value={data.inspection.total - data.inspection.passed - data.inspection.failed}
                      max={data.inspection.total || 1}
                      label="In Progress / Other"
                      color="#6366f1"
                    />
                  </div>
                  <div className="pt-2 border-t border-white/5">
                    <div className="flex justify-between text-xs">
                      <span className="text-white/40">Total Inspections</span>
                      <span className="text-white/70">{data.inspection.total}</span>
                    </div>
                    <div className="flex justify-between text-xs mt-1">
                      <span className="text-white/40">Pass Rate</span>
                      <span className="text-green-400 font-medium">{data.inspection.passRate}%</span>
                    </div>
                  </div>
                  <Link href="/inspections" className="block text-center text-xs text-cyan-400 hover:text-cyan-300 transition-colors">View Inspections →</Link>
                </div>

                {/* Commissioning Breakdown */}
                <div className="bg-[#111118] border border-white/5 rounded-xl p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <Zap size={16} className="text-yellow-400" />
                    <h3 className="font-medium text-white text-sm">Commissioning Breakdown</h3>
                  </div>
                  <div className="space-y-3">
                    <RadialBar value={data.commissioning.passed} max={data.commissioning.total || 1} label="Passed/Closed" color="#22c55e" />
                    <RadialBar value={data.commissioning.failed} max={data.commissioning.total || 1} label="Failed" color="#ef4444" />
                    <RadialBar
                      value={data.commissioning.total - data.commissioning.passed - data.commissioning.failed}
                      max={data.commissioning.total || 1}
                      label="Not Started / In Progress"
                      color="#6366f1"
                    />
                  </div>
                  <div className="pt-2 border-t border-white/5">
                    <div className="flex justify-between text-xs">
                      <span className="text-white/40">Total Records</span>
                      <span className="text-white/70">{data.commissioning.total}</span>
                    </div>
                    <div className="flex justify-between text-xs mt-1">
                      <span className="text-white/40">Pass Rate</span>
                      <span className="text-green-400 font-medium">{data.commissioning.passRate}%</span>
                    </div>
                  </div>
                  <Link href="/commissioning" className="block text-center text-xs text-yellow-400 hover:text-yellow-300 transition-colors">View Commissioning →</Link>
                </div>
              </div>

              <p className="text-xs text-white/20 text-center">
                Generated {new Date(data.generatedAt).toLocaleString()}
              </p>
            </>
          )}
          {!loading && !data && !error && (
            <div className="text-center py-20 text-white/30">
              <CheckCircle size={48} className="mx-auto mb-4 opacity-20" />
              <p>Select a project to view quality metrics</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function QualityPage() {
  return <ProtectedRoute><QualityPageContent /></ProtectedRoute>;
}
