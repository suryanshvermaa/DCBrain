'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  LayoutDashboard, FileText, Search, Bot, Shield, Calendar,
  Package, Activity, HelpCircle, Settings, Network, BarChart3,
  AlertOctagon, ClipboardList, Plus, Loader2, RefreshCw, Filter,
  ChevronRight, XCircle, AlertTriangle, CheckCircle, Clock, Zap, GitPullRequest,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import * as projectsApi from '@/lib/api/projects';
import * as inspApi from '@/lib/api/inspections';

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
  SCHEDULED: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  IN_PROGRESS: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  PASSED: 'bg-green-500/20 text-green-300 border-green-500/30',
  FAILED: 'bg-red-500/20 text-red-300 border-red-500/30',
  ON_HOLD: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  WAIVED: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

function InspectionsPageContent() {
  const pathname = usePathname();
  const [projects, setProjects] = useState<projectsApi.Project[]>([]);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [inspections, setInspections] = useState<inspApi.InspectionResponse[]>([]);
  const [summary, setSummary] = useState<inspApi.InspectionSummaryResponse | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<inspApi.InspectionStatus | ''>('');
  const [showOverdue, setShowOverdue] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<inspApi.InspectionResponse | null>(null);
  const [form, setForm] = useState({ title: '', discipline: '', itpRef: '', inspector: '', scheduledDate: '', holdPoint: false });
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
      const [listRes, summaryRes] = await Promise.all([
        inspApi.listInspections(projectId, {
          status: filterStatus || undefined,
          overdue: showOverdue ? true : undefined,
        }),
        inspApi.getInspectionSummary(projectId),
      ]);
      setInspections(listRes.inspections);
      setTotal(listRes.total);
      setSummary(summaryRes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [projectId, filterStatus, showOverdue]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  async function handleCreate() {
    if (!projectId || !form.title) { setFormError('Title is required'); return; }
    setCreating(true); setFormError('');
    try {
      await inspApi.createInspection(projectId, {
        title: form.title,
        itpRef: form.itpRef || undefined,
        discipline: form.discipline || undefined,
        holdPoint: form.holdPoint,
        inspector: form.inspector || undefined,
        scheduledDate: form.scheduledDate || undefined,
      });
      setShowModal(false);
      setForm({ title: '', discipline: '', itpRef: '', inspector: '', scheduledDate: '', holdPoint: false });
      await fetchData();
    } catch { setFormError('Failed to create inspection'); }
    finally { setCreating(false); }
  }

  async function handleStatusChange(inspId: string, newStatus: inspApi.InspectionStatus) {
    if (!projectId) return;
    setUpdatingId(inspId);
    try {
      await inspApi.updateInspection(projectId, inspId, { status: newStatus });
      await fetchData();
      if (selected?.id === inspId) {
        const updated = await inspApi.getInspection(projectId, inspId);
        setSelected(updated);
      }
    } catch (e) { console.error(e); }
    finally { setUpdatingId(null); }
  }

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
              <ClipboardList size={22} className="text-cyan-400" />
              Inspection Intelligence
            </h1>
            <p className="text-sm text-white/40 mt-0.5">ITP tracking and hold-point management</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => void fetchData()} className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-all">
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-lg shadow-cyan-500/20">
              <Plus size={16} /> New Inspection
            </button>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* Summary cards */}
            {summary && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total', value: summary.total, color: 'from-cyan-600 to-cyan-800' },
                  { label: 'Pass Rate', value: `${summary.passRate}%`, color: 'from-green-600 to-green-800' },
                  { label: 'Overdue Hold Points', value: summary.overdueHoldPoints, color: 'from-red-600 to-red-800' },
                  { label: 'Failed', value: summary.byStatus.FAILED, color: 'from-orange-600 to-orange-800' },
                ].map((c) => (
                  <div key={c.label} className="bg-[#111118] border border-white/5 rounded-xl p-4">
                    <div className={`text-3xl font-bold bg-gradient-to-r ${c.color} bg-clip-text text-transparent`}>{c.value}</div>
                    <div className="text-xs text-white/40 mt-1">{c.label}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Filters */}
            <div className="flex items-center gap-3">
              <Filter size={14} className="text-white/40" />
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as inspApi.InspectionStatus | '')} className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white/70">
                <option value="" className="bg-[#111118]">All Statuses</option>
                {['SCHEDULED','IN_PROGRESS','PASSED','FAILED','ON_HOLD','WAIVED'].map(s => (
                  <option key={s} value={s} className="bg-[#111118]">{s.replace('_',' ')}</option>
                ))}
              </select>
              <button onClick={() => setShowOverdue(!showOverdue)} className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${showOverdue ? 'border-red-500/50 bg-red-500/10 text-red-300' : 'border-white/10 text-white/50 hover:border-white/20'}`}>
                <AlertTriangle size={12} className="inline mr-1" />Overdue Only
              </button>
              <span className="text-xs text-white/30 ml-auto">{total} results</span>
            </div>

            {/* List */}
            {loading ? (
              <div className="flex items-center justify-center py-16"><Loader2 size={32} className="animate-spin text-cyan-400" /></div>
            ) : inspections.length === 0 ? (
              <div className="text-center py-16 text-white/30">
                <ClipboardList size={40} className="mx-auto mb-3 opacity-30" />
                <p>No inspections found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {inspections.map((insp) => (
                  <div key={insp.id} onClick={() => setSelected(insp)} className={`bg-[#111118] border rounded-xl p-4 cursor-pointer transition-all hover:border-cyan-500/30 ${selected?.id === insp.id ? 'border-cyan-500/50 bg-cyan-500/5' : 'border-white/5'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {insp.holdPoint && <span className="text-xs px-2 py-0.5 rounded-full border bg-orange-500/20 text-orange-300 border-orange-500/30">HOLD</span>}
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[insp.status]}`}>{insp.status.replace('_',' ')}</span>
                          {insp.overdue && <span className="text-xs text-red-400 flex items-center gap-1"><AlertTriangle size={10} />Overdue</span>}
                        </div>
                        <p className="font-medium text-white text-sm truncate">{insp.title}</p>
                        <div className="flex items-center gap-3 mt-1">
                          {insp.discipline && <span className="text-xs text-white/40">{insp.discipline}</span>}
                          {insp.itpRef && <span className="text-xs text-white/30 font-mono">{insp.itpRef}</span>}
                          {insp.scheduledDate && <span className="text-xs text-white/30 flex items-center gap-1"><Clock size={10} />{new Date(insp.scheduledDate).toLocaleDateString()}</span>}
                        </div>
                      </div>
                      <ChevronRight size={14} className="text-white/30 flex-shrink-0" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Detail pane */}
          {selected && (
            <div className="w-96 border-l border-white/5 bg-[#111118] flex flex-col overflow-hidden">
              <div className="p-5 border-b border-white/5 flex items-center justify-between">
                <h2 className="font-semibold text-sm text-white">{selected.title}</h2>
                <button onClick={() => setSelected(null)} className="text-white/40 hover:text-white"><XCircle size={18} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                <div className="flex gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full border ${STATUS_COLORS[selected.status]}`}>{selected.status.replace('_',' ')}</span>
                  {selected.holdPoint && <span className="text-xs px-2 py-1 rounded-full border bg-orange-500/20 text-orange-300 border-orange-500/30">HOLD POINT</span>}
                  {selected.overdue && <span className="text-xs px-2 py-1 rounded-full border bg-red-500/20 text-red-300 border-red-500/30">OVERDUE</span>}
                </div>
                {[
                  ['Discipline', selected.discipline],
                  ['ITP Reference', selected.itpRef],
                  ['Inspector', selected.inspector],
                  ['Scheduled', selected.scheduledDate ? new Date(selected.scheduledDate).toLocaleDateString() : null],
                  ['Completed', selected.completedDate ? new Date(selected.completedDate).toLocaleDateString() : null],
                  ['Result', selected.result],
                ].filter(([,v]) => v).map(([label, value]) => (
                  <div key={label as string}>
                    <p className="text-xs text-white/40 mb-1">{label}</p>
                    <p className="text-sm text-white/70">{value}</p>
                  </div>
                ))}
                <div>
                  <p className="text-xs text-white/40 mb-2">Update Status</p>
                  <div className="flex flex-wrap gap-2">
                    {(['SCHEDULED','IN_PROGRESS','PASSED','FAILED','ON_HOLD','WAIVED'] as inspApi.InspectionStatus[]).map((s) => (
                      <button key={s} disabled={s === selected.status || updatingId === selected.id} onClick={() => void handleStatusChange(selected.id, s)} className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${s === selected.status ? 'border-cyan-500/50 bg-cyan-500/20 text-cyan-300' : 'border-white/10 text-white/50 hover:text-white hover:border-white/20'} disabled:opacity-50`}>
                        {s.replace('_',' ')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111118] border border-white/10 rounded-2xl p-6 w-full max-w-lg">
            <h2 className="text-lg font-semibold text-white mb-5">Create Inspection</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-white/50 mb-1.5 block">Title *</label>
                <input value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50" placeholder="Inspection title" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-white/50 mb-1.5 block">Discipline</label>
                  <input value={form.discipline} onChange={(e) => setForm({...form, discipline: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none" placeholder="e.g. Electrical" />
                </div>
                <div>
                  <label className="text-xs text-white/50 mb-1.5 block">ITP Reference</label>
                  <input value={form.itpRef} onChange={(e) => setForm({...form, itpRef: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none" placeholder="ITP-001" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-white/50 mb-1.5 block">Inspector</label>
                  <input value={form.inspector} onChange={(e) => setForm({...form, inspector: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none" placeholder="Name" />
                </div>
                <div>
                  <label className="text-xs text-white/50 mb-1.5 block">Scheduled Date</label>
                  <input type="date" value={form.scheduledDate} onChange={(e) => setForm({...form, scheduledDate: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="holdPoint" checked={form.holdPoint} onChange={(e) => setForm({...form, holdPoint: e.target.checked})} className="rounded" />
                <label htmlFor="holdPoint" className="text-sm text-white/70">This is a hold point (requires witness)</label>
              </div>
              {formError && <p className="text-sm text-red-400">{formError}</p>}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => { setShowModal(false); setFormError(''); }} className="px-4 py-2 text-sm text-white/50 hover:text-white rounded-lg border border-white/10 hover:border-white/20 transition-all">Cancel</button>
              <button onClick={() => void handleCreate()} disabled={creating} className="px-5 py-2 bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50 flex items-center gap-2">
                {creating && <Loader2 size={14} className="animate-spin" />}Create Inspection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function InspectionsPage() {
  return <ProtectedRoute><InspectionsPageContent /></ProtectedRoute>;
}
