'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  RefreshCw,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  Database,
  Globe,
  Terminal,
  Search,
  Lock,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { useAppSelector } from '@/lib/hooks';
import { selectAuthenticatedUser } from '@/features/auth/authSlice';
import * as auditApi from '@/lib/api/audit';
import { ApiError } from '@/lib/api';

function AuditLogPageContent() {
  const user = useAppSelector(selectAuthenticatedUser);
  const router = useRouter();

  const [logs, setLogs] = useState<auditApi.AuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(15);
  const [actionFilter, setActionFilter] = useState('');
  const [resourceFilter, setResourceFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDetails, setSelectedDetails] = useState<any | null>(null);
  const [selectedDetailsTitle, setSelectedDetailsTitle] = useState('');

  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      router.replace('/');
    }
  }, [user, router]);

  const loadAuditLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await auditApi.listAuditLogs({
        page,
        limit,
        action: actionFilter || undefined,
        resourceType: resourceFilter || undefined,
      });
      setLogs(res.logs);
      setTotal(res.pagination.total);
      setTotalPages(res.pagination.pages);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to query audit logs');
    } finally {
      setLoading(false);
    }
  }, [page, limit, actionFilter, resourceFilter]);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      void loadAuditLogs();
    }
  }, [user, page, loadAuditLogs]);

  const getActionBadgeColor = (action: string) => {
    if (action.includes('delete')) return 'status-danger border';
    if (action.includes('upload') || action.includes('import') || action.includes('register'))
      return 'status-success border';
    if (action.includes('login') || action.includes('logout') || action.includes('refresh'))
      return 'bg-[var(--color-info-bg)] border border-[var(--color-info-border)] text-[var(--color-info-text)]';
    return 'bg-[var(--color-badge-default-bg)] border border-[var(--color-border)] text-[var(--color-badge-default-text)]';
  };

  if (user?.role !== 'ADMIN') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] p-8">
        <div className="flex max-w-sm flex-col items-center gap-3 text-center">
          <Lock className="h-10 w-10 animate-pulse text-[var(--color-danger)]" />
          <h3 className="text-lg font-bold text-[var(--color-text-primary)]">Access Denied</h3>
          <p className="text-xs text-[var(--color-text-secondary)]">
            You do not have the required administrative permissions to access the audit logs panel.
          </p>
          <Link
            href="/"
            className="mt-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-xs font-semibold text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface-hover)]"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const headerActions = (
    <button
      onClick={() => void loadAuditLogs()}
      disabled={loading}
      className="inline-flex h-9 items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface-hover)] disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
      Sync logs
    </button>
  );

  return (
    <AppShell
      title="System Audit Logs"
      subtitle="Immutable operations log and developer diagnostics"
      headerActions={headerActions}
    >
      <div className="p-8 space-y-6">
        {error && (
          <div className="rounded-lg border border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] px-4 py-3 text-sm text-[var(--color-danger-text)]">
            {error}
          </div>
        )}

        {/* Filter toolbar */}
        <div className="card-level-1 flex flex-wrap items-center justify-between gap-4 p-5 transition-theme">
          <div className="flex items-center gap-2 text-sm">
            <Search className="h-4 w-4 text-[var(--color-primary)]" />
            <span className="font-semibold text-[var(--color-text-primary)]">Query Filters</span>
          </div>
          <div className="flex flex-wrap gap-3">
            <input
              type="text"
              value={actionFilter}
              onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
              placeholder="Filter by action (e.g. auth.login)..."
              className="h-9 min-w-56 rounded-lg border border-[var(--color-input)] bg-[var(--color-input-bg)] px-3 text-xs text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-disabled)] transition-colors focus:border-[var(--color-ring)] focus:ring-2 focus:ring-[var(--color-focus-ring)]"
            />
            <input
              type="text"
              value={resourceFilter}
              onChange={(e) => { setResourceFilter(e.target.value); setPage(1); }}
              placeholder="Filter by resource type..."
              className="h-9 min-w-44 rounded-lg border border-[var(--color-input)] bg-[var(--color-input-bg)] px-3 text-xs text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-disabled)] transition-colors focus:border-[var(--color-ring)] focus:ring-2 focus:ring-[var(--color-focus-ring)]"
            />
          </div>
        </div>

        {/* Audit Logs Table */}
        <div className="card-level-1 overflow-hidden transition-theme">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--color-divider)] bg-[var(--color-surface-raised)] text-[var(--color-text-tertiary)]">
                  {['Timestamp', 'User', 'Action', 'Resource', 'IP Address', ''].map((h) => (
                    <th key={h} className={`p-4 font-semibold ${h === '' ? 'text-right' : ''}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-divider)]">
                {loading && logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-16 text-center text-[var(--color-text-secondary)]">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-[var(--color-primary)]" />
                        Loading audit records…
                      </div>
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-16 text-center text-[var(--color-text-secondary)]">
                      No audit records found matching the filter query.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="transition-colors hover:bg-[var(--color-surface-hover)]">
                      <td className="p-4 font-mono text-[var(--color-text-secondary)] shrink-0">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="p-4">
                        {log.user ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="font-semibold text-[var(--color-text-primary)]">{log.user.name}</span>
                            <span className="text-[10px] text-[var(--color-text-tertiary)]">{log.user.email}</span>
                          </div>
                        ) : (
                          <span className="font-semibold italic text-[var(--color-text-disabled)]">System</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider font-mono ${getActionBadgeColor(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="p-4">
                        {log.resourceType ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="font-semibold capitalize text-[var(--color-text-primary)]">{log.resourceType}</span>
                            <span className="font-mono text-[10px] text-[var(--color-text-tertiary)]">{log.resourceId || '—'}</span>
                          </div>
                        ) : (
                          <span className="font-semibold text-[var(--color-text-disabled)]">—</span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="flex items-center gap-1 font-mono text-[var(--color-text-primary)]">
                            <Globe className="h-3 w-3 shrink-0 text-[var(--color-text-tertiary)]" />
                            {log.ipAddress || '127.0.0.1'}
                          </span>
                          <span className="line-clamp-1 max-w-[200px] text-[9px] text-[var(--color-text-disabled)]" title={log.userAgent ?? ''}>
                            {log.userAgent || '—'}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        {log.details ? (
                          <button
                            onClick={() => {
                              setSelectedDetails(log.details);
                              setSelectedDetailsTitle(`${log.action} - Details`);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-2.5 py-1 text-xs font-semibold text-[var(--color-link)] transition-colors hover:bg-[var(--color-surface-hover)]"
                          >
                            <Eye className="h-3 w-3" />
                            Explore
                          </button>
                        ) : (
                          <span className="italic text-[var(--color-text-disabled)]">None</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex select-none items-center justify-between border-t border-[var(--color-divider)] p-4">
              <span className="text-xs text-[var(--color-text-secondary)]">
                Showing page {page} of {totalPages} ({total} logs total)
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded border border-[var(--color-border)] p-1 transition-colors hover:bg-[var(--color-surface-hover)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded border border-[var(--color-border)] p-1 transition-colors hover:bg-[var(--color-surface-hover)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* JSON Details Modal */}
      {selectedDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="card-level-3 flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden transition-theme">
            <div className="flex items-center justify-between border-b border-[var(--color-divider)] p-4">
              <span className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text-primary)]">
                <Terminal className="h-4 w-4 text-[var(--color-primary)]" />
                {selectedDetailsTitle}
              </span>
              <button
                onClick={() => setSelectedDetails(null)}
                className="rounded p-1 text-[var(--color-text-tertiary)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="scrollbar-thin overflow-y-auto bg-[var(--color-surface-raised)] p-6 font-mono text-xs text-[var(--color-success)] select-text">
              <pre className="whitespace-pre-wrap">{JSON.stringify(selectedDetails, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

export default function AuditLogPage() {
  return (
    <ProtectedRoute>
      <AuditLogPageContent />
    </ProtectedRoute>
  );
}
