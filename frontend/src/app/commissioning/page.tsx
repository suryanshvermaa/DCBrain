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
import { AppShell } from '@/components/layout/AppShell';
import * as projectsApi from '@/lib/api/projects';
import * as cxApi from '@/lib/api/commissioning';

const STATUS_COLORS: Record<string, string> = {
  NOT_STARTED: 'bg-[var(--color-badge-default-bg)] text-[var(--color-badge-default-text)] border border-[var(--color-border)]',
  IN_PROGRESS: 'status-warning border',
  PASSED: 'status-success border',
  FAILED: 'status-danger border',
  CLOSED: 'status-info border',
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
        <Plus size={16} /> New Record
      </button>
    </div>
  );

  return (
    <AppShell
      title="Commissioning Copilot"
      subtitle="System commissioning and test record tracking"
      headerActions={headerActions}
    >
        <div className="flex-1 flex flex-col overflow-hidden min-h-[calc(100vh-4rem)] p-8 space-y-6">
          {/* Summary */}
          {summary && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
              {[
                { label: 'Total', value: summary.total, color: 'text-[var(--color-primary)]' },
                { label: 'Pass Rate', value: `${summary.passRate}%`, color: 'text-[var(--color-success)]' },
                { label: 'Passed', value: summary.byStatus.PASSED, color: 'text-[var(--color-success)]' },
                { label: 'Pending', value: summary.pendingCount, color: 'text-[var(--color-text-secondary)]' },
              ].map((c) => (
                <div key={c.label} className="card-level-1 p-4 transition-theme">
                  <div className={`text-3xl font-bold ${c.color}`}>{c.value}</div>
                  <div className="text-xs text-[var(--color-text-secondary)] mt-1">{c.label}</div>
                </div>
              ))}
            </div>
          )}

          <div className="flex-1 flex gap-6 overflow-hidden min-h-0">
            <div className="flex-1 overflow-y-auto">

          {/* Kanban board */}
          {loading ? (
            <div className="flex items-center justify-center py-16"><Loader2 size={32} className="animate-spin text-[var(--color-primary)]" /></div>
          ) : (
            <div className="grid grid-cols-5 gap-4 min-h-[24rem]">
              {STATUS_ORDER.map((status) => (
                <div key={status} className="card-level-1 p-3 transition-theme flex flex-col h-full">
                  <div className="flex items-center justify-between mb-3 shrink-0">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${STATUS_COLORS[status]}`}>
                      {status.replace('_',' ')}
                    </span>
                    <span className="text-xs text-[var(--color-text-tertiary)]">{byStatus[status].length}</span>
                  </div>
                  <div className="flex-1 space-y-2 overflow-y-auto">
                    {byStatus[status].map((cx) => (
                      <div
                        key={cx.id}
                        onClick={() => setSelected(cx)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all hover:border-[var(--color-ring)] ${selected?.id === cx.id ? 'border-[var(--color-primary)]/50 bg-[var(--color-primary)]/5' : 'border-[var(--color-border)] bg-[var(--color-surface-raised)]'}`}
                      >
                        <p className="text-xs font-medium text-[var(--color-text-primary)] truncate">{cx.systemName}</p>
                        {cx.discipline && <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{cx.discipline}</p>}
                        {cx.testRef && <p className="text-xs text-[var(--color-text-tertiary)] font-mono mt-0.5">{cx.testRef}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
            </div>

            {/* Detail pane */}
            {selected && (
              <div className="w-80 border-l border-[var(--color-divider)] bg-[var(--color-surface)] flex flex-col overflow-hidden flex-shrink-0 transition-theme">
                <div className="p-5 border-b border-[var(--color-divider)] flex items-center justify-between bg-[var(--color-surface-raised)]">
                  <h2 className="font-semibold text-sm text-[var(--color-text-primary)] truncate">{selected.systemName}</h2>
                  <button onClick={() => setSelected(null)} className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] flex-shrink-0"><XCircle size={18} /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  <span className={`text-xs px-2 py-1 rounded-full border ${STATUS_COLORS[selected.status]}`}>{selected.status.replace('_',' ')}</span>
                  {[['Test Reference', selected.testRef], ['Discipline', selected.discipline], ['Procedure', selected.procedure], ['Tested By', selected.testedBy], ['Result', selected.result], ['Completed', selected.completedDate ? new Date(selected.completedDate).toLocaleDateString() : null]].filter(([,v]) => v).map(([label, value]) => (
                    <div key={label as string}>
                      <p className="text-xs text-[var(--color-text-tertiary)] mb-1">{label}</p>
                      <p className="text-sm text-[var(--color-text-primary)]">{value}</p>
                    </div>
                  ))}
                  <div className="pt-4 border-t border-[var(--color-divider)]">
                    <p className="text-xs text-[var(--color-text-tertiary)] mb-2">Move to Status</p>
                    <div className="flex flex-col gap-2">
                      {STATUS_ORDER.map((s) => (
                        <button key={s} disabled={s === selected.status || updatingId === selected.id} onClick={() => void handleStatusChange(selected.id, s)} className={`text-xs px-3 py-1.5 rounded-lg border transition-all text-left ${s === selected.status ? 'border-[var(--color-primary)]/50 bg-[var(--color-primary)]/10 text-[var(--color-primary)]' : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-ring)]'} disabled:opacity-50`}>
                          {updatingId === selected.id && s === selected.status ? <Loader2 size={10} className="animate-spin inline" /> : s.replace('_',' ')}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card-level-3 w-full max-w-lg rounded-2xl border border-[var(--color-divider)] overflow-hidden transition-theme">
            <div className="p-6 border-b border-[var(--color-divider)] flex justify-between items-center bg-[var(--color-surface-raised)]">
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">New Commissioning Record</h2>
              <button onClick={() => setShowModal(false)} className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors">
                <XCircle size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">System Name *</label>
                <input value={form.systemName} onChange={(e) => setForm({...form, systemName: e.target.value})} className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input)] rounded-lg px-4 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-ring)] focus:ring-1 focus:ring-[var(--color-focus-ring)] transition-all" placeholder="e.g. Cooling System A" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Test Reference</label>
                  <input value={form.testRef} onChange={(e) => setForm({...form, testRef: e.target.value})} className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input)] rounded-lg px-4 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-ring)] focus:ring-1 focus:ring-[var(--color-focus-ring)] transition-all" placeholder="CX-001" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Discipline</label>
                  <input value={form.discipline} onChange={(e) => setForm({...form, discipline: e.target.value})} className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input)] rounded-lg px-4 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-ring)] focus:ring-1 focus:ring-[var(--color-focus-ring)] transition-all" placeholder="e.g. MEP" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Procedure</label>
                <input value={form.procedure} onChange={(e) => setForm({...form, procedure: e.target.value})} className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input)] rounded-lg px-4 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-ring)] focus:ring-1 focus:ring-[var(--color-focus-ring)] transition-all" placeholder="Commissioning procedure name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Tested By</label>
                <input value={form.testedBy} onChange={(e) => setForm({...form, testedBy: e.target.value})} className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input)] rounded-lg px-4 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-ring)] focus:ring-1 focus:ring-[var(--color-focus-ring)] transition-all" placeholder="Engineer name" />
              </div>
              {formError && <p className="text-sm text-[var(--color-danger-text)] bg-[var(--color-danger-bg)] border border-[var(--color-danger-border)] p-2 rounded-lg">{formError}</p>}
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-[var(--color-divider)] bg-[var(--color-surface-raised)]">
              <button onClick={() => { setShowModal(false); setFormError(''); }} className="px-4 py-2 rounded-lg text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)] transition-all">Cancel</button>
              <button onClick={() => void handleCreate()} disabled={creating} className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2">
                {creating && <Loader2 size={16} className="animate-spin" />}Create Record
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

export default function CommissioningPage() {
  return <ProtectedRoute><CommissioningPageContent /></ProtectedRoute>;
}
