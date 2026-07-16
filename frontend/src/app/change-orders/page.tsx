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
import { AppShell } from '@/components/layout/AppShell';
import * as projectsApi from '@/lib/api/projects';
import * as coApi from '@/lib/api/change-orders';

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-[var(--color-badge-default-bg)] text-[var(--color-badge-default-text)] border border-[var(--color-border)]',
  PENDING_APPROVAL: 'status-warning border',
  APPROVED: 'status-success border',
  REJECTED: 'status-danger border',
  CANCELLED: 'bg-[var(--color-surface-hover)] text-[var(--color-text-tertiary)] border border-[var(--color-border)]',
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
      <button onClick={() => setShowModal(true)} className="inline-flex h-9 items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-hover)] shadow-sm">
        <Plus size={16} /> New CO
      </button>
    </div>
  );

  return (
    <AppShell
      title="Change Orders"
      subtitle="Track cost and schedule impact changes"
      headerActions={headerActions}
    >
        <div className="flex-1 flex gap-6 overflow-hidden min-h-[calc(100vh-4rem)] p-8">
          <div className="flex-1 overflow-y-auto space-y-4">
            {/* Summary cards */}
            {summary && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total COs', value: summary.total, color: 'text-[var(--color-primary)]', icon: GitPullRequest },
                  { label: 'Approved Cost Impact', value: formatCurrency(summary.totalCostImpact), color: 'text-[var(--color-danger)]', icon: DollarSign },
                  { label: 'Schedule Impact', value: `${summary.totalScheduleImpactDays}d`, color: 'text-[var(--color-warning)]', icon: Clock },
                  { label: 'Pending Approval', value: summary.pendingCount, color: 'text-[var(--color-success)]', icon: TrendingUp },
                ].map((c) => (
                  <div key={c.label} className="card-level-1 p-4 transition-theme">
                    <div className={`text-3xl font-bold ${c.color}`}>{c.value}</div>
                    <div className="text-xs text-[var(--color-text-secondary)] mt-1">{c.label}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Filter */}
            <div className="flex items-center gap-3">
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as coApi.ChangeOrderStatus | '')} className="h-8 rounded-lg border border-[var(--color-input)] bg-[var(--color-input-bg)] px-3 text-sm text-[var(--color-text-primary)] outline-none">
                <option value="">All Statuses</option>
                {['DRAFT','PENDING_APPROVAL','APPROVED','REJECTED','CANCELLED'].map(s => (
                  <option key={s} value={s}>{s.replace('_',' ')}</option>
                ))}
              </select>
              <span className="text-xs text-[var(--color-text-tertiary)] ml-auto">{total} results</span>
            </div>

            {/* Table */}
            {loading ? (
              <div className="flex items-center justify-center py-16"><Loader2 size={32} className="animate-spin text-[var(--color-primary)]" /></div>
            ) : cos.length === 0 ? (
              <div className="text-center py-16 text-[var(--color-text-tertiary)]">
                <GitPullRequest size={40} className="mx-auto mb-3 opacity-30" />
                <p>No Change Orders found</p>
              </div>
            ) : (
              <div className="card-level-1 rounded-xl overflow-hidden transition-theme">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--color-divider)] bg-[var(--color-surface-raised)]">
                      <th className="text-left px-4 py-3 text-xs text-[var(--color-text-secondary)] font-medium">Number</th>
                      <th className="text-left px-4 py-3 text-xs text-[var(--color-text-secondary)] font-medium">Title</th>
                      <th className="text-left px-4 py-3 text-xs text-[var(--color-text-secondary)] font-medium">Status</th>
                      <th className="text-right px-4 py-3 text-xs text-[var(--color-text-secondary)] font-medium">Cost Impact</th>
                      <th className="text-right px-4 py-3 text-xs text-[var(--color-text-secondary)] font-medium">Schedule</th>
                      <th className="text-right px-4 py-3 text-xs text-[var(--color-text-secondary)] font-medium">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cos.map((co) => (
                      <tr key={co.id} onClick={() => setSelected(co)} className={`border-b border-[var(--color-divider)] cursor-pointer transition-all hover:bg-[var(--color-surface-hover)] ${selected?.id === co.id ? 'bg-[var(--color-primary)]/5' : ''}`}>
                        <td className="px-4 py-3 font-mono text-xs text-[var(--color-text-tertiary)]">{co.number}</td>
                        <td className="px-4 py-3 text-[var(--color-text-primary)]">{co.title}</td>
                        <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[co.status]}`}>{co.status.replace('_',' ')}</span></td>
                        <td className="px-4 py-3 text-right text-[var(--color-text-secondary)]">{formatCurrency(co.costImpact)}</td>
                        <td className="px-4 py-3 text-right text-[var(--color-text-secondary)]">{co.scheduleImpactDays}d</td>
                        <td className="px-4 py-3 text-right text-[var(--color-text-tertiary)] text-xs">{new Date(co.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Detail pane */}
          {selected && (
            <div className="w-96 border-l border-[var(--color-divider)] bg-[var(--color-surface)] flex flex-col overflow-hidden transition-theme">
              <div className="p-5 border-b border-[var(--color-divider)] flex items-center justify-between bg-[var(--color-surface-raised)]">
                <h2 className="font-semibold text-sm text-[var(--color-text-primary)]">{selected.number}</h2>
                <button onClick={() => setSelected(null)} className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"><XCircle size={18} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                <span className={`text-xs px-2 py-1 rounded-full border ${STATUS_COLORS[selected.status]}`}>{selected.status.replace('_',' ')}</span>
                <div>
                  <p className="text-xs text-[var(--color-text-tertiary)] mb-1">Title</p>
                  <p className="text-sm text-[var(--color-text-primary)] font-medium">{selected.title}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--color-text-tertiary)] mb-1">Description</p>
                  <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{selected.description}</p>
                </div>
                {selected.reason && (
                  <div>
                    <p className="text-xs text-[var(--color-text-tertiary)] mb-1">Reason</p>
                    <p className="text-sm text-[var(--color-text-secondary)]">{selected.reason}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-[var(--color-text-tertiary)] mb-1">Cost Impact</p>
                    <p className="text-lg font-bold text-[var(--color-danger)]">{formatCurrency(selected.costImpact)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--color-text-tertiary)] mb-1">Schedule Impact</p>
                    <p className="text-lg font-bold text-[var(--color-warning)]">{selected.scheduleImpactDays} days</p>
                  </div>
                </div>
                <div className="pt-4 border-t border-[var(--color-divider)]">
                  <p className="text-xs text-[var(--color-text-tertiary)] mb-2">Update Status</p>
                  <div className="flex flex-wrap gap-2">
                    {(['DRAFT','PENDING_APPROVAL','APPROVED','REJECTED','CANCELLED'] as coApi.ChangeOrderStatus[]).map((s) => (
                      <button key={s} disabled={s === selected.status || updatingId === selected.id} onClick={() => void handleStatusChange(selected.id, s)} className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${s === selected.status ? 'border-[var(--color-primary)]/50 bg-[var(--color-primary)]/10 text-[var(--color-primary)]' : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-ring)]'} disabled:opacity-50`}>
                        {updatingId === selected.id && s === selected.status ? <Loader2 size={10} className="animate-spin inline" /> : s.replace('_',' ')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card-level-3 w-full max-w-lg rounded-2xl border border-[var(--color-divider)] overflow-hidden transition-theme">
            <div className="p-6 border-b border-[var(--color-divider)] flex justify-between items-center bg-[var(--color-surface-raised)]">
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">New Change Order</h2>
              <button onClick={() => setShowModal(false)} className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors">
                <XCircle size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Title *</label>
                <input value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input)] rounded-lg px-4 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-ring)] focus:ring-1 focus:ring-[var(--color-focus-ring)] transition-all" placeholder="Change order title" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Description *</label>
                <textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} rows={3} className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input)] rounded-lg px-4 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-ring)] focus:ring-1 focus:ring-[var(--color-focus-ring)] transition-all resize-none" placeholder="Scope of changes..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Reason</label>
                <input value={form.reason} onChange={(e) => setForm({...form, reason: e.target.value})} className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input)] rounded-lg px-4 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-ring)] focus:ring-1 focus:ring-[var(--color-focus-ring)] transition-all" placeholder="Why this change is needed" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Cost Impact ($)</label>
                  <input type="number" value={form.costImpact} onChange={(e) => setForm({...form, costImpact: e.target.value})} className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input)] rounded-lg px-4 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-ring)] focus:ring-1 focus:ring-[var(--color-focus-ring)] transition-all" placeholder="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Schedule Impact (days)</label>
                  <input type="number" value={form.scheduleImpactDays} onChange={(e) => setForm({...form, scheduleImpactDays: e.target.value})} className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input)] rounded-lg px-4 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-ring)] focus:ring-1 focus:ring-[var(--color-focus-ring)] transition-all" placeholder="0" />
                </div>
              </div>
              {formError && <p className="text-sm text-[var(--color-danger-text)] bg-[var(--color-danger-bg)] border border-[var(--color-danger-border)] p-2 rounded-lg">{formError}</p>}
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-[var(--color-divider)] bg-[var(--color-surface-raised)]">
              <button onClick={() => { setShowModal(false); setFormError(''); }} className="px-4 py-2 rounded-lg text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)] transition-all">Cancel</button>
              <button onClick={() => void handleCreate()} disabled={creating} className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2">
                {creating && <Loader2 size={16} className="animate-spin" />}Create CO
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

export default function ChangeOrdersPage() {
  return <ProtectedRoute><ChangeOrdersPageContent /></ProtectedRoute>;
}
