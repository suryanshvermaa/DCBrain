'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Loader2, Upload } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import * as projectsApi from '@/lib/api/projects';
import * as procurementApi from '@/lib/api/procurement';

function ProcurementPageContent() {
  const [projects, setProjects] = useState<projectsApi.Project[]>([]);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [items, setItems] = useState<procurementApi.ProcurementItem[]>([]);
  const [vendors, setVendors] = useState<procurementApi.Vendor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    async function loadProjects() {
      try {
        const result = await projectsApi.listProjects();
        setProjects(result.projects);
        if (result.projects.length > 0) {
          setProjectId(result.projects[0].id);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load projects');
      }
    }
    void loadProjects();
  }, []);

  const loadProcurementData = useCallback(async (pid: string) => {
    setLoading(true);
    setError(null);
    try {
      const [itemsRes, vendorsRes] = await Promise.all([
        procurementApi.getProcurementItems(pid),
        procurementApi.getVendors(pid),
      ]);
      setItems(itemsRes.items);
      setVendors(vendorsRes.vendors);
    } catch (err: any) {
      setError(err.message || 'Failed to load procurement data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (projectId) {
      void loadProcurementData(projectId);
    }
  }, [projectId, loadProcurementData]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !projectId) return;
    setUploading(true);
    setError(null);
    try {
      const result = await procurementApi.importProcurement(projectId, file);
      alert(`Successfully imported ${result.importedCount} items.`);
      void loadProcurementData(projectId);
    } catch (err: any) {
      setError(err.message || 'Failed to import file');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === projectId) ?? null,
    [projectId, projects],
  );

  const atRiskCount = items.filter(
    (i) =>
      i.status !== 'RECEIVED' &&
      i.status !== 'INSTALLED' &&
      i.requiredOnSiteDate &&
      new Date(i.requiredOnSiteDate).getTime() < Date.now() + 30 * 24 * 60 * 60 * 1000,
  ).length;

  const headerActions = (
    <div className="flex items-center gap-2">
      <select
        className="h-9 min-w-44 rounded-lg border border-[var(--color-input)] bg-[var(--color-input-bg)] px-3 text-sm text-[var(--color-text-primary)] outline-none transition-colors focus:border-[var(--color-ring)] focus:ring-2 focus:ring-[var(--color-focus-ring)]"
        value={projectId ?? ''}
        onChange={(e) => setProjectId(e.target.value || null)}
      >
        {projects.length === 0 ? <option value="">No projects</option> : null}
        {projects.map((p) => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>
      <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-hover)]">
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        Import CSV/XLSX
        <input
          type="file"
          accept=".csv, .xlsx"
          className="hidden"
          onChange={handleFileUpload}
          disabled={uploading || !projectId}
        />
      </label>
    </div>
  );

  return (
    <AppShell
      title="Procurement Intelligence"
      subtitle={selectedProject ? `${selectedProject.name} (${selectedProject.code})` : undefined}
      headerActions={headerActions}
    >
      <div className="p-8 space-y-8">
        {error && (
          <div className="rounded-lg border border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] px-4 py-3 text-sm text-[var(--color-danger-text)]">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex min-h-48 items-center justify-center gap-2 text-sm text-[var(--color-text-secondary)]">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading procurement data…
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--color-border)] p-12 text-center text-sm text-[var(--color-text-secondary)]">
            No procurement items found. Please import a procurement file.
          </div>
        ) : (
          <>
            {/* KPI cards */}
            <section className="grid gap-6 lg:grid-cols-3">
              {[
                { label: 'Total Items', value: items.length, colorClass: '' },
                { label: 'Vendors', value: vendors.length, colorClass: '' },
                { label: 'At Risk Items', value: atRiskCount, colorClass: 'text-[var(--color-warning-text)]' },
              ].map(({ label, value, colorClass }) => (
                <div key={label} className="card-level-1 p-6 transition-theme">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
                    {label}
                  </h3>
                  <p className={`mt-2 text-3xl font-bold text-[var(--color-text-primary)] ${colorClass}`}>
                    {value}
                  </p>
                </div>
              ))}
            </section>

            {/* Items table */}
            <div className="card-level-1 overflow-hidden transition-theme">
              <table className="min-w-full divide-y divide-[var(--color-divider)]">
                <thead className="bg-[var(--color-surface-raised)]">
                  <tr>
                    {['Item', 'Vendor', 'Status', 'Promised', 'Required On Site'].map((h) => (
                      <th
                        key={h}
                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--color-text-tertiary)]"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-divider)] bg-[var(--color-card)]">
                  {items.map((item) => (
                    <tr key={item.id} className="transition-colors hover:bg-[var(--color-surface-hover)]">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-[var(--color-text-primary)]">
                          {item.material}
                        </div>
                        <div className="text-xs text-[var(--color-text-secondary)]">
                          Qty: {item.quantity} {item.unit}{item.poNumber ? ` | PO: ${item.poNumber}` : ''}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-[var(--color-text-primary)]">
                        {item.vendor?.name}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex rounded-full bg-[var(--color-info-bg)] px-2 text-xs font-semibold leading-5 text-[var(--color-info-text)]">
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-[var(--color-text-secondary)]">
                        {item.promisedDate ? new Date(item.promisedDate).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-[var(--color-text-secondary)]">
                        {item.requiredOnSiteDate
                          ? new Date(item.requiredOnSiteDate).toLocaleDateString()
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

export default function ProcurementPage() {
  return (
    <ProtectedRoute>
      <ProcurementPageContent />
    </ProtectedRoute>
  );
}
