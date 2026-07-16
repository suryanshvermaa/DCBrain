'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  LayoutDashboard, FileText, Search, Bot, Shield, Calendar,
  Package, Activity, HelpCircle, Settings, Network, BarChart3,
  AlertOctagon, ClipboardList, Plus, Loader2, RefreshCw,
  XCircle, CheckCircle, ChevronRight, Zap, GitPullRequest,
  TrendingUp, DollarSign, Clock,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import * as projectsApi from '@/lib/api/projects';
import * as coApi from '@/lib/api/change-orders';

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
  DRAFT: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  PENDING_APPROVAL: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  APPROVED: 'bg-green-500/20 text-green-300 border-green-500/30',
  REJECTED: 'bg-red-500/20 text-red-300 border-red-500/30',
  CANCELLED: 'bg-gray-500/20 text-gray-500 border-gray-700/30',
};

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

function ChangeOrdersPageContent() {
  const pathname = usePathname();
  const [projects, setProjects] = useState<projectsApi.Project[]>([]);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [cos, setCos] = useState<coApi.CoResponse[]>([]);
  const [summary, setSummary] = useState<coApi.CoSummaryResponse | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<coApi.ChangeOrderStatus | ''>('');
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<coApi.CoResponse | null>(null);
  const [form, setForm] = useState({ title: '', description: '', reason: '', costImpact: '', scheduleImpactDays: '' });
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
        coApi.listChangeOrders(projectId, { status: filterStatus || undefined }),
        coApi.getChangeOrderSummary(projectId),
      ]);
      setCos(listRes.changeOrders);
      setTotal(listRes.total);
      setSummary(sumRes);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [projectId, filterStatus]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  async function handleCreate() {
    if (!projectId || !form.title || !form.description) { setFormError('Title and description are required'); return; }
    setCreating(true); setFormError('');
    try {
      await coApi.createChangeOrder(projectId, {
        title: form.title,
        description: form.description,
        reason: form.reason || undefined,
        costImpact: form.costImpact ? parseFloat(form.costImpact) : 0,
        scheduleImpactDays: form.scheduleImpactDays ? parseInt(form.scheduleImpactDays) : 0,
      });
      setShowModal(false);
      setForm({ title: '', description: '', reason: '', costImpact: '', scheduleImpactDays: '' });
      await fetchData();
    } catch { setFormError('Failed to create Change Order'); }
    finally { setCreating(false); }
  }

  async function handleStatusChange(coId: string, newStatus: coApi.ChangeOrderStatus) {
    if (!projectId) return;
    setUpdatingId(coId);
    try {
      await coApi.updateChangeOrder(projectId, coId, { status: newStatus });
      await fetchData();
      if (selected?.id === coId) {
        const updated = await coApi.getChangeOrder(projectId, coId);
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
              <GitPullRequest size={22} className="text-purple-400" />
              Change Orders
            </h1>
            <p className="text-sm text-white/40 mt-0.5">Track cost and schedule impact changes</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => void fetchData()} className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-all">
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-lg shadow-purple-500/20">
              <Plus size={16} /> New CO
            </button>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* Summary cards */}
            {summary && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total COs', value: summary.total, color: 'from-purple-600 to-purple-800', icon: GitPullRequest },
                  { label: 'Approved Cost Impact', value: formatCurrency(summary.totalCostImpact), color: 'from-red-600 to-red-800', icon: DollarSign },
                  { label: 'Schedule Impact', value: `${summary.totalScheduleImpactDays}d`, color: 'from-orange-600 to-orange-800', icon: Clock },
                  { label: 'Pending Approval', value: summary.pendingCount, color: 'from-yellow-600 to-yellow-800', icon: TrendingUp },
                ].map((c) => (
                  <div key={c.label} className="bg-[#111118] border border-white/5 rounded-xl p-4">
                    <div className={`text-3xl font-bold bg-gradient-to-r ${c.color} bg-clip-text text-transparent`}>{c.value}</div>
                    <div className="text-xs text-white/40 mt-1">{c.label}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Filter */}
            <div className="flex items-center gap-3">
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as coApi.ChangeOrderStatus | '')} className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white/70">
                <option value="" className="bg-[#111118]">All Statuses</option>
                {['DRAFT','PENDING_APPROVAL','APPROVED','REJECTED','CANCELLED'].map(s => (
                  <option key={s} value={s} className="bg-[#111118]">{s.replace('_',' ')}</option>
                ))}
              </select>
              <span className="text-xs text-white/30 ml-auto">{total} results</span>
            </div>

            {/* Table */}
            {loading ? (
              <div className="flex items-center justify-center py-16"><Loader2 size={32} className="animate-spin text-purple-400" /></div>
            ) : cos.length === 0 ? (
              <div className="text-center py-16 text-white/30">
                <GitPullRequest size={40} className="mx-auto mb-3 opacity-30" />
                <p>No Change Orders found</p>
              </div>
            ) : (
              <div className="bg-[#111118] border border-white/5 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-left px-4 py-3 text-xs text-white/40 font-medium">Number</th>
                      <th className="text-left px-4 py-3 text-xs text-white/40 font-medium">Title</th>
                      <th className="text-left px-4 py-3 text-xs text-white/40 font-medium">Status</th>
                      <th className="text-right px-4 py-3 text-xs text-white/40 font-medium">Cost Impact</th>
                      <th className="text-right px-4 py-3 text-xs text-white/40 font-medium">Schedule</th>
                      <th className="text-right px-4 py-3 text-xs text-white/40 font-medium">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cos.map((co) => (
                      <tr key={co.id} onClick={() => setSelected(co)} className={`border-b border-white/3 cursor-pointer transition-all hover:bg-white/3 ${selected?.id === co.id ? 'bg-purple-500/5' : ''}`}>
                        <td className="px-4 py-3 font-mono text-xs text-white/40">{co.number}</td>
                        <td className="px-4 py-3 text-white">{co.title}</td>
                        <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[co.status]}`}>{co.status.replace('_',' ')}</span></td>
                        <td className="px-4 py-3 text-right text-white/70">{formatCurrency(co.costImpact)}</td>
                        <td className="px-4 py-3 text-right text-white/70">{co.scheduleImpactDays}d</td>
                        <td className="px-4 py-3 text-right text-white/30 text-xs">{new Date(co.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Detail pane */}
          {selected && (
            <div className="w-96 border-l border-white/5 bg-[#111118] flex flex-col overflow-hidden">
              <div className="p-5 border-b border-white/5 flex items-center justify-between">
                <h2 className="font-semibold text-sm text-white">{selected.number}</h2>
                <button onClick={() => setSelected(null)} className="text-white/40 hover:text-white"><XCircle size={18} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                <span className={`text-xs px-2 py-1 rounded-full border ${STATUS_COLORS[selected.status]}`}>{selected.status.replace('_',' ')}</span>
                <div>
                  <p className="text-xs text-white/40 mb-1">Title</p>
                  <p className="text-sm text-white font-medium">{selected.title}</p>
                </div>
                <div>
                  <p className="text-xs text-white/40 mb-1">Description</p>
                  <p className="text-sm text-white/70 leading-relaxed">{selected.description}</p>
                </div>
                {selected.reason && (
                  <div>
                    <p className="text-xs text-white/40 mb-1">Reason</p>
                    <p className="text-sm text-white/70">{selected.reason}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-white/40 mb-1">Cost Impact</p>
                    <p className="text-lg font-bold text-red-400">{formatCurrency(selected.costImpact)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/40 mb-1">Schedule Impact</p>
                    <p className="text-lg font-bold text-orange-400">{selected.scheduleImpactDays} days</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-white/40 mb-2">Update Status</p>
                  <div className="flex flex-wrap gap-2">
                    {(['DRAFT','PENDING_APPROVAL','APPROVED','REJECTED','CANCELLED'] as coApi.ChangeOrderStatus[]).map((s) => (
                      <button key={s} disabled={s === selected.status || updatingId === selected.id} onClick={() => void handleStatusChange(selected.id, s)} className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${s === selected.status ? 'border-purple-500/50 bg-purple-500/20 text-purple-300' : 'border-white/10 text-white/50 hover:text-white hover:border-white/20'} disabled:opacity-50`}>
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
            <h2 className="text-lg font-semibold text-white mb-5">New Change Order</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-white/50 mb-1.5 block">Title *</label>
                <input value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50" placeholder="Change order title" />
              </div>
              <div>
                <label className="text-xs text-white/50 mb-1.5 block">Description *</label>
                <textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} rows={3} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50 resize-none" placeholder="Scope of changes..." />
              </div>
              <div>
                <label className="text-xs text-white/50 mb-1.5 block">Reason</label>
                <input value={form.reason} onChange={(e) => setForm({...form, reason: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none" placeholder="Why this change is needed" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-white/50 mb-1.5 block">Cost Impact ($)</label>
                  <input type="number" value={form.costImpact} onChange={(e) => setForm({...form, costImpact: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none" placeholder="0" />
                </div>
                <div>
                  <label className="text-xs text-white/50 mb-1.5 block">Schedule Impact (days)</label>
                  <input type="number" value={form.scheduleImpactDays} onChange={(e) => setForm({...form, scheduleImpactDays: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none" placeholder="0" />
                </div>
              </div>
              {formError && <p className="text-sm text-red-400">{formError}</p>}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => { setShowModal(false); setFormError(''); }} className="px-4 py-2 text-sm text-white/50 hover:text-white rounded-lg border border-white/10 hover:border-white/20 transition-all">Cancel</button>
              <button onClick={() => void handleCreate()} disabled={creating} className="px-5 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50 flex items-center gap-2">
                {creating && <Loader2 size={14} className="animate-spin" />}Create CO
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ChangeOrdersPage() {
  return <ProtectedRoute><ChangeOrdersPageContent /></ProtectedRoute>;
}
