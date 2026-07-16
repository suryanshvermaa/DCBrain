'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  LayoutDashboard, FileText, Search, Bot, Shield, Calendar,
  Package, Activity, HelpCircle, Settings, Network, BarChart3,
  AlertOctagon, Plus, Loader2, RefreshCw, Filter, ChevronRight,
  XCircle, CheckCircle, Clock, AlertTriangle, ClipboardList,
  GitPullRequest, Zap,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import * as projectsApi from '@/lib/api/projects';
import * as ncrApi from '@/lib/api/ncr';

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

const SEVERITY_COLORS: Record<string, string> = {
  MINOR: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  MAJOR: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  CRITICAL: 'bg-red-500/20 text-red-300 border-red-500/30',
};

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-red-500/20 text-red-300 border-red-500/30',
  UNDER_REVIEW: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  RESOLVED: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  CLOSED: 'bg-green-500/20 text-green-300 border-green-500/30',
  VOID: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

function NcrsPageContent() {
  const pathname = usePathname();
  const [projects, setProjects] = useState<projectsApi.Project[]>([]);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [ncrs, setNcrs] = useState<ncrApi.NcrResponse[]>([]);
  const [analytics, setAnalytics] = useState<ncrApi.NcrAnalyticsResponse | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<ncrApi.NcrStatus | ''>('');
  const [filterSeverity, setFilterSeverity] = useState<ncrApi.NcrSeverity | ''>('');
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<ncrApi.NcrResponse | null>(null);

  // Create form
  const [form, setForm] = useState({ title: '', description: '', severity: 'MINOR' as ncrApi.NcrSeverity, discipline: '', rootCause: '' });
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');

  // Update status
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
      const [ncrRes, analyticsRes] = await Promise.all([
        ncrApi.listNcrs(projectId, {
          status: filterStatus || undefined,
          severity: filterSeverity || undefined,
        }),
        ncrApi.getNcrAnalytics(projectId),
      ]);
      setNcrs(ncrRes.ncrs);
      setTotal(ncrRes.total);
      setAnalytics(analyticsRes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [projectId, filterStatus, filterSeverity]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  async function handleCreate() {
    if (!projectId || !form.title || !form.description) {
      setFormError('Title and description are required');
      return;
    }
    setCreating(true);
    setFormError('');
    try {
      await ncrApi.createNcr(projectId, {
        title: form.title,
        description: form.description,
        severity: form.severity,
        discipline: form.discipline || undefined,
        rootCause: form.rootCause || undefined,
      });
      setShowModal(false);
      setForm({ title: '', description: '', severity: 'MINOR', discipline: '', rootCause: '' });
      await fetchData();
    } catch {
      setFormError('Failed to create NCR');
    } finally {
      setCreating(false);
    }
  }

  async function handleStatusChange(ncrId: string, newStatus: ncrApi.NcrStatus) {
    if (!projectId) return;
    setUpdatingId(ncrId);
    try {
      await ncrApi.updateNcr(projectId, ncrId, { status: newStatus });
      await fetchData();
      if (selected?.id === ncrId) {
        const updated = await ncrApi.getNcr(projectId, ncrId);
        setSelected(updated);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="flex h-screen bg-[#0a0a0f] text-white overflow-hidden">
      {/* Sidebar */}
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
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                  active
                    ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
              >
                <item.icon size={16} />
                {item.name}
              </Link>
            );
          })}
        </nav>
        {projects.length > 1 && (
          <div className="p-4 border-t border-white/5">
            <label className="text-xs text-white/40 mb-2 block">Project</label>
            <select
              value={projectId ?? ''}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id} className="bg-[#111118]">{p.name}</option>
              ))}
            </select>
          </div>
        )}
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="border-b border-white/5 bg-[#111118]/50 backdrop-blur-xl px-8 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <AlertOctagon size={22} className="text-orange-400" />
              Non-Conformance Reports
            </h1>
            <p className="text-sm text-white/40 mt-0.5">Track quality defects and non-conformances</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => void fetchData()}
              className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-all"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-500 hover:to-violet-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-lg shadow-violet-500/20"
            >
              <Plus size={16} /> New NCR
            </button>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {/* List pane */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* Analytics cards */}
            {analytics && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total NCRs', value: analytics.total, color: 'from-violet-600 to-violet-800' },
                  { label: 'Open', value: analytics.open, color: 'from-red-600 to-red-800' },
                  { label: 'Critical', value: analytics.bySeverity.CRITICAL, color: 'from-orange-600 to-orange-800' },
                  { label: 'Resolved', value: analytics.resolved, color: 'from-green-600 to-green-800' },
                ].map((card) => (
                  <div key={card.label} className="bg-[#111118] border border-white/5 rounded-xl p-4">
                    <div className={`text-3xl font-bold bg-gradient-to-r ${card.color} bg-clip-text text-transparent`}>
                      {card.value}
                    </div>
                    <div className="text-xs text-white/40 mt-1">{card.label}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Filters */}
            <div className="flex items-center gap-3">
              <Filter size={14} className="text-white/40" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as ncrApi.NcrStatus | '')}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white/70"
              >
                <option value="" className="bg-[#111118]">All Statuses</option>
                {['OPEN','UNDER_REVIEW','RESOLVED','CLOSED','VOID'].map(s => (
                  <option key={s} value={s} className="bg-[#111118]">{s.replace('_', ' ')}</option>
                ))}
              </select>
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value as ncrApi.NcrSeverity | '')}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white/70"
              >
                <option value="" className="bg-[#111118]">All Severities</option>
                {['MINOR','MAJOR','CRITICAL'].map(s => (
                  <option key={s} value={s} className="bg-[#111118]">{s}</option>
                ))}
              </select>
              <span className="text-xs text-white/30 ml-auto">{total} results</span>
            </div>

            {/* NCR list */}
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 size={32} className="animate-spin text-violet-400" />
              </div>
            ) : ncrs.length === 0 ? (
              <div className="text-center py-16 text-white/30">
                <AlertOctagon size={40} className="mx-auto mb-3 opacity-30" />
                <p>No NCRs found</p>
                <p className="text-sm mt-1">Create your first NCR to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {ncrs.map((ncr) => (
                  <div
                    key={ncr.id}
                    onClick={() => setSelected(ncr)}
                    className={`bg-[#111118] border rounded-xl p-4 cursor-pointer transition-all hover:border-violet-500/30 ${
                      selected?.id === ncr.id ? 'border-violet-500/50 bg-violet-500/5' : 'border-white/5'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-white/40">{ncr.number}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${SEVERITY_COLORS[ncr.severity]}`}>
                            {ncr.severity}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[ncr.status]}`}>
                            {ncr.status.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="font-medium text-white text-sm truncate">{ncr.title}</p>
                        {ncr.discipline && <p className="text-xs text-white/40 mt-0.5">{ncr.discipline}</p>}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-white/30">
                          {new Date(ncr.createdAt).toLocaleDateString()}
                        </span>
                        <ChevronRight size={14} className="text-white/30" />
                      </div>
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
                <h2 className="font-semibold text-sm text-white">{selected.number}</h2>
                <button onClick={() => setSelected(null)} className="text-white/40 hover:text-white">
                  <XCircle size={18} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                <div>
                  <p className="text-xs text-white/40 mb-1">Title</p>
                  <p className="text-sm text-white font-medium">{selected.title}</p>
                </div>
                <div className="flex gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full border ${SEVERITY_COLORS[selected.severity]}`}>
                    {selected.severity}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full border ${STATUS_COLORS[selected.status]}`}>
                    {selected.status.replace('_', ' ')}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-white/40 mb-1">Description</p>
                  <p className="text-sm text-white/70 leading-relaxed">{selected.description}</p>
                </div>
                {selected.discipline && (
                  <div>
                    <p className="text-xs text-white/40 mb-1">Discipline</p>
                    <p className="text-sm text-white/70">{selected.discipline}</p>
                  </div>
                )}
                {selected.rootCause && (
                  <div>
                    <p className="text-xs text-white/40 mb-1">Root Cause</p>
                    <p className="text-sm text-white/70 leading-relaxed">{selected.rootCause}</p>
                  </div>
                )}
                {selected.resolutionNote && (
                  <div>
                    <p className="text-xs text-white/40 mb-1">Resolution</p>
                    <p className="text-sm text-white/70 leading-relaxed">{selected.resolutionNote}</p>
                  </div>
                )}
                <div className="text-xs text-white/30">
                  Created {new Date(selected.createdAt).toLocaleString()}
                </div>

                {/* Status transitions */}
                <div>
                  <p className="text-xs text-white/40 mb-2">Update Status</p>
                  <div className="flex flex-wrap gap-2">
                    {(['OPEN','UNDER_REVIEW','RESOLVED','CLOSED','VOID'] as ncrApi.NcrStatus[]).map((s) => (
                      <button
                        key={s}
                        disabled={s === selected.status || updatingId === selected.id}
                        onClick={() => void handleStatusChange(selected.id, s)}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                          s === selected.status
                            ? 'border-violet-500/50 bg-violet-500/20 text-violet-300'
                            : 'border-white/10 text-white/50 hover:text-white hover:border-white/20'
                        } disabled:opacity-50`}
                      >
                        {updatingId === selected.id && s === selected.status ? (
                          <Loader2 size={10} className="animate-spin inline" />
                        ) : s.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111118] border border-white/10 rounded-2xl p-6 w-full max-w-lg">
            <h2 className="text-lg font-semibold text-white mb-5">Create NCR</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-white/50 mb-1.5 block">Title *</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50"
                  placeholder="Non-conformance summary"
                />
              </div>
              <div>
                <label className="text-xs text-white/50 mb-1.5 block">Description *</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50 resize-none"
                  placeholder="Detailed description of the non-conformance..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-white/50 mb-1.5 block">Severity</label>
                  <select
                    value={form.severity}
                    onChange={(e) => setForm({ ...form, severity: e.target.value as ncrApi.NcrSeverity })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                  >
                    {['MINOR','MAJOR','CRITICAL'].map(s => (
                      <option key={s} value={s} className="bg-[#111118]">{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-white/50 mb-1.5 block">Discipline</label>
                  <input
                    value={form.discipline}
                    onChange={(e) => setForm({ ...form, discipline: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50"
                    placeholder="e.g. Mechanical"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-white/50 mb-1.5 block">Root Cause</label>
                <input
                  value={form.rootCause}
                  onChange={(e) => setForm({ ...form, rootCause: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50"
                  placeholder="Initial root cause assessment"
                />
              </div>
              {formError && <p className="text-sm text-red-400">{formError}</p>}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => { setShowModal(false); setFormError(''); }}
                className="px-4 py-2 text-sm text-white/50 hover:text-white rounded-lg border border-white/10 hover:border-white/20 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => void handleCreate()}
                disabled={creating}
                className="px-5 py-2 bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-500 hover:to-violet-600 text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {creating && <Loader2 size={14} className="animate-spin" />}
                Create NCR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NcrsPage() {
  return (
    <ProtectedRoute>
      <NcrsPageContent />
    </ProtectedRoute>
  );
}
