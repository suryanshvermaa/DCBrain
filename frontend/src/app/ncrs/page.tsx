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
import { AppShell } from '@/components/layout/AppShell';
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
  MINOR: 'status-info border',
  MAJOR: 'status-warning border',
  CRITICAL: 'status-danger border',
};

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'status-danger border',
  UNDER_REVIEW: 'status-warning border',
  RESOLVED: 'status-info border',
  CLOSED: 'status-success border',
  VOID: 'bg-[var(--color-badge-default-bg)] text-[var(--color-badge-default-text)] border border-[var(--color-border)]',
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
      <button
        onClick={() => void fetchData()}
        className="inline-flex h-9 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
      >
        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
      </button>
      <button
        onClick={() => setShowModal(true)}
        className="inline-flex h-9 items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-hover)] shadow-sm"
      >
        <Plus size={16} /> New NCR
      </button>
    </div>
  );

  return (
    <AppShell
      title="Non-Conformance Reports"
      subtitle="Track quality defects and non-conformances"
      headerActions={headerActions}
    >
        <div className="flex-1 flex overflow-hidden min-h-[calc(100vh-4rem)]">
          {/* List pane */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* Analytics cards */}
            {analytics && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total NCRs', value: analytics.total, color: 'text-[var(--color-primary)]' },
                  { label: 'Open', value: analytics.open, color: 'text-[var(--color-danger)]' },
                  { label: 'Critical', value: analytics.bySeverity.CRITICAL, color: 'text-[var(--color-warning)]' },
                  { label: 'Resolved', value: analytics.resolved, color: 'text-[var(--color-success)]' },
                ].map((card) => (
                  <div key={card.label} className="card-level-1 p-4 transition-theme">
                    <div className={`text-3xl font-bold ${card.color}`}>
                      {card.value}
                    </div>
                    <div className="text-xs text-[var(--color-text-secondary)] mt-1">{card.label}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Filters */}
            <div className="flex items-center gap-3">
              <Filter size={14} className="text-[var(--color-text-tertiary)]" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as ncrApi.NcrStatus | '')}
                className="h-8 rounded-lg border border-[var(--color-input)] bg-[var(--color-input-bg)] px-3 text-sm text-[var(--color-text-primary)] outline-none"
              >
                <option value="">All Statuses</option>
                {['OPEN','UNDER_REVIEW','RESOLVED','CLOSED','VOID'].map(s => (
                  <option key={s} value={s}>{s.replace('_', ' ')}</option>
                ))}
              </select>
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value as ncrApi.NcrSeverity | '')}
                className="h-8 rounded-lg border border-[var(--color-input)] bg-[var(--color-input-bg)] px-3 text-sm text-[var(--color-text-primary)] outline-none"
              >
                <option value="">All Severities</option>
                {['MINOR','MAJOR','CRITICAL'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <span className="text-xs text-[var(--color-text-tertiary)] ml-auto">{total} results</span>
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

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card-level-3 w-full max-w-lg rounded-2xl border border-[var(--color-divider)] overflow-hidden transition-theme">
            <div className="p-6 border-b border-[var(--color-divider)] flex justify-between items-center bg-[var(--color-surface-raised)]">
              <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Raise New NCR</h2>
              <button onClick={() => setShowModal(false)} className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors">
                <XCircle size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-[var(--color-danger-bg)] border border-[var(--color-danger-border)] text-[var(--color-danger-text)] text-sm rounded-lg flex items-center gap-2">
                  <AlertTriangle size={16} /> {formError}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="E.g., Concrete pouring defect in Sector 4"
                  className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input)] rounded-lg px-4 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-ring)] focus:ring-1 focus:ring-[var(--color-focus-ring)] transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Detailed description of the non-conformance..."
                  rows={4}
                  className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input)] rounded-lg px-4 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-ring)] focus:ring-1 focus:ring-[var(--color-focus-ring)] transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Severity</label>
                  <select
                    value={form.severity}
                    onChange={e => setForm({ ...form, severity: e.target.value as ncrApi.NcrSeverity })}
                    className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input)] rounded-lg px-4 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-ring)] focus:ring-1 focus:ring-[var(--color-focus-ring)] transition-all"
                  >
                    <option value="MINOR">Minor</option>
                    <option value="MAJOR">Major</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Discipline (Optional)</label>
                  <input
                    type="text"
                    value={form.discipline}
                    onChange={e => setForm({ ...form, discipline: e.target.value })}
                    placeholder="E.g., Civil, Mechanical"
                    className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input)] rounded-lg px-4 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-ring)] focus:ring-1 focus:ring-[var(--color-focus-ring)] transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Root Cause (Optional)</label>
                <input
                  type="text"
                  value={form.rootCause}
                  onChange={e => setForm({ ...form, rootCause: e.target.value })}
                  placeholder="Initial assessment of root cause"
                  className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input)] rounded-lg px-4 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-ring)] focus:ring-1 focus:ring-[var(--color-focus-ring)] transition-all"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-divider)]">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)] transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => void handleCreate()}
                  disabled={creating}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                >
                  {creating && <Loader2 size={16} className="animate-spin" />}
                  Submit NCR
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

export default function NcrsPage() {
  return (
    <ProtectedRoute>
      <NcrsPageContent />
    </ProtectedRoute>
  );
}
