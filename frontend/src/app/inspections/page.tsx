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
import { AppShell } from '@/components/layout/AppShell';
import * as projectsApi from '@/lib/api/projects';
import * as inspApi from '@/lib/api/inspections';
const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: 'status-info border',
  IN_PROGRESS: 'status-warning border',
  PASSED: 'status-success border',
  FAILED: 'status-danger border',
  ON_HOLD: 'status-warning border',
  WAIVED: 'bg-[var(--color-badge-default-bg)] text-[var(--color-badge-default-text)] border border-[var(--color-border)]',
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
        <Plus size={16} /> New Inspection
      </button>
    </div>
  );

  return (
    <AppShell
      title="Inspection Intelligence"
      subtitle="ITP tracking and hold-point management"
      headerActions={headerActions}
    >
        <div className="flex-1 flex gap-6 overflow-hidden min-h-[calc(100vh-4rem)] p-8">
          <div className="flex-1 overflow-y-auto space-y-4">
            {/* Summary cards */}
            {summary && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total', value: summary.total, color: 'text-[var(--color-primary)]' },
                  { label: 'Pass Rate', value: `${summary.passRate}%`, color: 'text-[var(--color-success)]' },
                  { label: 'Overdue Hold Points', value: summary.overdueHoldPoints, color: 'text-[var(--color-danger)]' },
                  { label: 'Failed', value: summary.byStatus.FAILED, color: 'text-[var(--color-warning)]' },
                ].map((c) => (
                  <div key={c.label} className="card-level-1 p-4 transition-theme">
                    <div className={`text-3xl font-bold ${c.color}`}>{c.value}</div>
                    <div className="text-xs text-[var(--color-text-secondary)] mt-1">{c.label}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Filters */}
            <div className="flex items-center gap-3">
              <Filter size={14} className="text-[var(--color-text-tertiary)]" />
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as inspApi.InspectionStatus | '')} className="h-8 rounded-lg border border-[var(--color-input)] bg-[var(--color-input-bg)] px-3 text-sm text-[var(--color-text-primary)] outline-none">
                <option value="">All Statuses</option>
                {['SCHEDULED','IN_PROGRESS','PASSED','FAILED','ON_HOLD','WAIVED'].map(s => (
                  <option key={s} value={s}>{s.replace('_',' ')}</option>
                ))}
              </select>
              <button onClick={() => setShowOverdue(!showOverdue)} className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${showOverdue ? 'border-[var(--color-danger)]/50 bg-[var(--color-danger-bg)] text-[var(--color-danger-text)]' : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-ring)]'}`}>
                <AlertTriangle size={12} className="inline mr-1" />Overdue Only
              </button>
              <span className="text-xs text-[var(--color-text-tertiary)] ml-auto">{total} results</span>
            </div>

            {/* List */}
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 size={32} className="animate-spin text-[var(--color-primary)]" />
              </div>
            ) : inspections.length === 0 ? (
              <div className="text-center py-16 text-[var(--color-text-tertiary)]">
                <ClipboardList size={40} className="mx-auto mb-3 opacity-30" />
                <p>No inspections found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {inspections.map((insp) => (
                  <div key={insp.id} onClick={() => setSelected(insp)} className={`card-level-1 p-4 cursor-pointer transition-theme ${selected?.id === insp.id ? 'ring-1 ring-[var(--color-primary)]' : 'hover:bg-[var(--color-surface-hover)]'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {insp.holdPoint && <span className="text-xs px-2 py-0.5 rounded-full border status-warning border">HOLD</span>}
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[insp.status]}`}>{insp.status.replace('_',' ')}</span>
                          {insp.overdue && <span className="text-xs text-[var(--color-danger-text)] flex items-center gap-1"><AlertTriangle size={10} />Overdue</span>}
                        </div>
                        <p className="font-medium text-[var(--color-text-primary)] text-sm truncate">{insp.title}</p>
                        <div className="flex items-center gap-3 mt-1">
                          {insp.discipline && <span className="text-xs text-[var(--color-text-secondary)]">{insp.discipline}</span>}
                          {insp.itpRef && <span className="text-xs text-[var(--color-text-tertiary)] font-mono">{insp.itpRef}</span>}
                          {insp.scheduledDate && <span className="text-xs text-[var(--color-text-tertiary)] flex items-center gap-1"><Clock size={10} />{new Date(insp.scheduledDate).toLocaleDateString()}</span>}
                        </div>
                      </div>
                      <ChevronRight size={14} className="text-[var(--color-text-tertiary)] flex-shrink-0" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Detail pane */}
          {selected && (
            <div className="w-96 border-l border-[var(--color-divider)] bg-[var(--color-surface)] flex flex-col overflow-hidden transition-theme">
              <div className="p-5 border-b border-[var(--color-divider)] flex items-center justify-between bg-[var(--color-surface-raised)]">
                <h2 className="font-semibold text-sm text-[var(--color-text-primary)]">{selected.title}</h2>
                <button onClick={() => setSelected(null)} className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"><XCircle size={18} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                <div className="flex gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full border ${STATUS_COLORS[selected.status]}`}>{selected.status.replace('_',' ')}</span>
                  {selected.holdPoint && <span className="text-xs px-2 py-1 rounded-full border status-warning border">HOLD POINT</span>}
                  {selected.overdue && <span className="text-xs px-2 py-1 rounded-full border status-danger border">OVERDUE</span>}
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
                    <p className="text-xs text-[var(--color-text-tertiary)] mb-1">{label}</p>
                    <p className="text-sm text-[var(--color-text-primary)]">{value}</p>
                  </div>
                ))}
                <div className="pt-4 border-t border-[var(--color-divider)]">
                  <p className="text-xs text-[var(--color-text-tertiary)] mb-2">Update Status</p>
                  <div className="flex flex-wrap gap-2">
                    {(['SCHEDULED','IN_PROGRESS','PASSED','FAILED','ON_HOLD','WAIVED'] as inspApi.InspectionStatus[]).map((s) => (
                      <button key={s} disabled={s === selected.status || updatingId === selected.id} onClick={() => void handleStatusChange(selected.id, s)} className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${s === selected.status ? 'border-[var(--color-primary)]/50 bg-[var(--color-primary)]/10 text-[var(--color-primary)]' : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-ring)]'} disabled:opacity-50`}>
                        {s.replace('_',' ')}
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
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Create Inspection</h2>
              <button onClick={() => setShowModal(false)} className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors">
                <XCircle size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Title *</label>
                <input value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input)] rounded-lg px-4 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-ring)] focus:ring-1 focus:ring-[var(--color-focus-ring)] transition-all" placeholder="Inspection title" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Discipline</label>
                  <input value={form.discipline} onChange={(e) => setForm({...form, discipline: e.target.value})} className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input)] rounded-lg px-4 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-ring)] focus:ring-1 focus:ring-[var(--color-focus-ring)] transition-all" placeholder="e.g. Electrical" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">ITP Reference</label>
                  <input value={form.itpRef} onChange={(e) => setForm({...form, itpRef: e.target.value})} className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input)] rounded-lg px-4 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-ring)] focus:ring-1 focus:ring-[var(--color-focus-ring)] transition-all" placeholder="ITP-001" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Inspector</label>
                  <input value={form.inspector} onChange={(e) => setForm({...form, inspector: e.target.value})} className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input)] rounded-lg px-4 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-ring)] focus:ring-1 focus:ring-[var(--color-focus-ring)] transition-all" placeholder="Name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Scheduled Date</label>
                  <input type="date" value={form.scheduledDate} onChange={(e) => setForm({...form, scheduledDate: e.target.value})} className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input)] rounded-lg px-4 py-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-ring)] focus:ring-1 focus:ring-[var(--color-focus-ring)] transition-all" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="holdPoint" checked={form.holdPoint} onChange={(e) => setForm({...form, holdPoint: e.target.checked})} className="rounded border-[var(--color-input)]" />
                <label htmlFor="holdPoint" className="text-sm text-[var(--color-text-secondary)]">This is a hold point (requires witness)</label>
              </div>
              {formError && <p className="text-sm text-[var(--color-danger-text)] bg-[var(--color-danger-bg)] border border-[var(--color-danger-border)] p-2 rounded-lg">{formError}</p>}
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-[var(--color-divider)] bg-[var(--color-surface-raised)]">
              <button onClick={() => { setShowModal(false); setFormError(''); }} className="px-4 py-2 rounded-lg text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)] transition-all">Cancel</button>
              <button onClick={() => void handleCreate()} disabled={creating} className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2">
                {creating && <Loader2 size={16} className="animate-spin" />}Create Inspection
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

export default function InspectionsPage() {
  return <ProtectedRoute><InspectionsPageContent /></ProtectedRoute>;
}
