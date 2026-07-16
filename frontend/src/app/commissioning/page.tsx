'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  LayoutDashboard, FileText, Search, Bot, Shield, Calendar,
  Package, Activity, HelpCircle, Settings, Network, BarChart3,
  AlertOctagon, ClipboardList, Plus, Loader2, RefreshCw,
  XCircle, CheckCircle, ChevronRight, Zap, GitPullRequest,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import * as projectsApi from '@/lib/api/projects';
import * as cxApi from '@/lib/api/commissioning';

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

const STATUS_COLORS: Record<string, string> = {
  NOT_STARTED: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  IN_PROGRESS: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  PASSED: 'bg-green-500/20 text-green-300 border-green-500/30',
  FAILED: 'bg-red-500/20 text-red-300 border-red-500/30',
  CLOSED: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
};

const STATUS_ORDER: cxApi.CommissioningStatus[] = ['NOT_STARTED', 'IN_PROGRESS', 'PASSED', 'FAILED', 'CLOSED'];

function CommissioningPageContent() {
  const pathname = usePathname();
  const [projects, setProjects] = useState<projectsApi.Project[]>([]);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [records, setRecords] = useState<cxApi.CxResponse[]>([]);
  const [summary, setSummary] = useState<cxApi.CxSummaryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<cxApi.CommissioningStatus | ''>('');
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<cxApi.CxResponse | null>(null);
  const [form, setForm] = useState({ systemName: '', testRef: '', discipline: '', procedure: '', testedBy: '' });
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    projectsApi.listProjects().then((res) => {
      setProjects(res.projects);
      if (res.projects.length > 0) setProjectId(res.projects[0].id);
    }).catch(() => {});
  }, []);

  const fetchData = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const [listRes, sumRes] = await Promise.all([
        cxApi.listCommissioning(projectId, { status: filterStatus || undefined }),
        cxApi.getCommissioningSummary(projectId),
      ]);
      setRecords(listRes.records);
      setSummary(sumRes);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [projectId, filterStatus]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  async function handleCreate() {
    if (!projectId || !form.systemName) { setFormError('System name is required'); return; }
    setCreating(true); setFormError('');
    try {
      await cxApi.createCommissioning(projectId, {
        systemName: form.systemName,
        testRef: form.testRef || undefined,
        discipline: form.discipline || undefined,
        procedure: form.procedure || undefined,
        testedBy: form.testedBy || undefined,
      });
      setShowModal(false);
      setForm({ systemName: '', testRef: '', discipline: '', procedure: '', testedBy: '' });
      await fetchData();
    } catch { setFormError('Failed to create commissioning record'); }
    finally { setCreating(false); }
  }

  async function handleStatusChange(cxId: string, newStatus: cxApi.CommissioningStatus) {
    if (!projectId) return;
    setUpdatingId(cxId);
    try {
      await cxApi.updateCommissioning(projectId, cxId, { status: newStatus });
      await fetchData();
      if (selected?.id === cxId) {
        const updated = await cxApi.getCommissioning(projectId, cxId);
        setSelected(updated);
      }
    } catch (e) { console.error(e); }
    finally { setUpdatingId(null); }
  }

  // Group by status for Kanban view
  const byStatus = STATUS_ORDER.reduce<Record<string, cxApi.CxResponse[]>>((acc, s) => {
    acc[s] = records.filter(r => r.status === s);
    return acc;
  }, {});

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
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="border-b border-white/5 bg-[#111118]/50 backdrop-blur-xl px-8 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Zap size={22} className="text-yellow-400" />
              Commissioning Copilot
            </h1>
            <p className="text-sm text-white/40 mt-0.5">System commissioning and test record tracking</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => void fetchData()} className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-all">
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-500 hover:to-amber-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-lg shadow-yellow-500/20">
              <Plus size={16} /> New Record
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Summary */}
          {summary && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total', value: summary.total, color: 'from-yellow-600 to-amber-800' },
                { label: 'Pass Rate', value: `${summary.passRate}%`, color: 'from-green-600 to-green-800' },
                { label: 'Passed', value: summary.byStatus.PASSED, color: 'from-emerald-600 to-emerald-800' },
                { label: 'Pending', value: summary.pendingCount, color: 'from-gray-600 to-gray-800' },
              ].map((c) => (
                <div key={c.label} className="bg-[#111118] border border-white/5 rounded-xl p-4">
                  <div className={`text-3xl font-bold bg-gradient-to-r ${c.color} bg-clip-text text-transparent`}>{c.value}</div>
                  <div className="text-xs text-white/40 mt-1">{c.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Kanban board */}
          {loading ? (
            <div className="flex items-center justify-center py-16"><Loader2 size={32} className="animate-spin text-yellow-400" /></div>
          ) : (
            <div className="grid grid-cols-5 gap-4 min-h-96">
              {STATUS_ORDER.map((status) => (
                <div key={status} className="bg-[#111118] border border-white/5 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${STATUS_COLORS[status]}`}>
                      {status.replace('_',' ')}
                    </span>
                    <span className="text-xs text-white/30">{byStatus[status].length}</span>
                  </div>
                  <div className="space-y-2">
                    {byStatus[status].map((cx) => (
                      <div
                        key={cx.id}
                        onClick={() => setSelected(cx)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all hover:border-yellow-500/30 ${selected?.id === cx.id ? 'border-yellow-500/50 bg-yellow-500/5' : 'border-white/5 bg-white/2'}`}
                      >
                        <p className="text-xs font-medium text-white truncate">{cx.systemName}</p>
                        {cx.discipline && <p className="text-xs text-white/40 mt-0.5">{cx.discipline}</p>}
                        {cx.testRef && <p className="text-xs text-white/30 font-mono mt-0.5">{cx.testRef}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Detail pane */}
      {selected && (
        <div className="w-80 border-l border-white/5 bg-[#111118] flex flex-col overflow-hidden flex-shrink-0">
          <div className="p-5 border-b border-white/5 flex items-center justify-between">
            <h2 className="font-semibold text-sm text-white truncate">{selected.systemName}</h2>
            <button onClick={() => setSelected(null)} className="text-white/40 hover:text-white flex-shrink-0"><XCircle size={18} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <span className={`text-xs px-2 py-1 rounded-full border ${STATUS_COLORS[selected.status]}`}>{selected.status.replace('_',' ')}</span>
            {[['Test Reference', selected.testRef], ['Discipline', selected.discipline], ['Procedure', selected.procedure], ['Tested By', selected.testedBy], ['Result', selected.result], ['Completed', selected.completedDate ? new Date(selected.completedDate).toLocaleDateString() : null]].filter(([,v]) => v).map(([label, value]) => (
              <div key={label as string}>
                <p className="text-xs text-white/40 mb-1">{label}</p>
                <p className="text-sm text-white/70">{value}</p>
              </div>
            ))}
            <div>
              <p className="text-xs text-white/40 mb-2">Move to Status</p>
              <div className="flex flex-col gap-2">
                {STATUS_ORDER.map((s) => (
                  <button key={s} disabled={s === selected.status || updatingId === selected.id} onClick={() => void handleStatusChange(selected.id, s)} className={`text-xs px-3 py-1.5 rounded-lg border transition-all text-left ${s === selected.status ? 'border-yellow-500/50 bg-yellow-500/20 text-yellow-300' : 'border-white/10 text-white/50 hover:text-white hover:border-white/20'} disabled:opacity-50`}>
                    {updatingId === selected.id && s === selected.status ? <Loader2 size={10} className="animate-spin inline" /> : s.replace('_',' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111118] border border-white/10 rounded-2xl p-6 w-full max-w-lg">
            <h2 className="text-lg font-semibold text-white mb-5">New Commissioning Record</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-white/50 mb-1.5 block">System Name *</label>
                <input value={form.systemName} onChange={(e) => setForm({...form, systemName: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-yellow-500/50" placeholder="e.g. Cooling System A" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-white/50 mb-1.5 block">Test Reference</label>
                  <input value={form.testRef} onChange={(e) => setForm({...form, testRef: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none" placeholder="CX-001" />
                </div>
                <div>
                  <label className="text-xs text-white/50 mb-1.5 block">Discipline</label>
                  <input value={form.discipline} onChange={(e) => setForm({...form, discipline: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none" placeholder="e.g. MEP" />
                </div>
              </div>
              <div>
                <label className="text-xs text-white/50 mb-1.5 block">Procedure</label>
                <input value={form.procedure} onChange={(e) => setForm({...form, procedure: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none" placeholder="Commissioning procedure name" />
              </div>
              <div>
                <label className="text-xs text-white/50 mb-1.5 block">Tested By</label>
                <input value={form.testedBy} onChange={(e) => setForm({...form, testedBy: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none" placeholder="Engineer name" />
              </div>
              {formError && <p className="text-sm text-red-400">{formError}</p>}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => { setShowModal(false); setFormError(''); }} className="px-4 py-2 text-sm text-white/50 hover:text-white rounded-lg border border-white/10 hover:border-white/20 transition-all">Cancel</button>
              <button onClick={() => void handleCreate()} disabled={creating} className="px-5 py-2 bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-500 hover:to-amber-500 text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50 flex items-center gap-2">
                {creating && <Loader2 size={14} className="animate-spin" />}Create Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CommissioningPage() {
  return <ProtectedRoute><CommissioningPageContent /></ProtectedRoute>;
}
