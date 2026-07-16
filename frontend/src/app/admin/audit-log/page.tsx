'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  LayoutDashboard,
  FileText,
  Search,
  Bot,
  Shield,
  Calendar,
  Package,
  Activity,
  HelpCircle,
  Network,
  BarChart3,
  Settings,
  RefreshCw,
  Loader2,
  Lock,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  Database,
  Globe,
  Terminal,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { selectAuthenticatedUser, clearAuth } from '@/features/auth/authSlice';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import * as auditApi from '@/lib/api/audit';
import { ApiError } from '@/lib/api';
import { api as baseApiClient } from '@/lib/api';

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
  { name: 'Agents', href: '/agents', icon: Bot },
  { name: 'Knowledge Graph', href: '/graph', icon: Network },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

function AuditLogPageContent() {
  const user = useAppSelector(selectAuthenticatedUser);
  const router = useRouter();
  const dispatch = useAppDispatch();

  // Audit Logs State
  const [logs, setLogs] = useState<auditApi.AuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(15);

  // Filters
  const [actionFilter, setActionFilter] = useState('');
  const [resourceFilter, setResourceFilter] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // JSON Details Modal State
  const [selectedDetails, setSelectedDetails] = useState<any | null>(null);
  const [selectedDetailsTitle, setSelectedDetailsTitle] = useState('');

  // Enforce ADMIN role
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

  const handleLogout = async () => {
    try {
      const baseUrl = baseApiClient.getBaseUrl();
      const token = baseApiClient.getToken();
      await fetch(`${baseUrl}/api/v1/auth/logout`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (err) {
      console.error(err);
    } finally {
      dispatch(clearAuth());
      router.push('/login');
    }
  };

  const getActionBadgeColor = (action: string) => {
    if (action.includes('delete')) {
      return 'bg-rose-500/10 border-rose-500/20 text-rose-400';
    }
    if (action.includes('upload') || action.includes('import') || action.includes('register')) {
      return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
    }
    if (action.includes('login') || action.includes('logout') || action.includes('refresh')) {
      return 'bg-sky-500/10 border-sky-500/20 text-sky-400';
    }
    return 'bg-slate-800 border-slate-700/50 text-slate-300';
  };

  if (user?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-100 p-8">
        <div className="flex flex-col items-center gap-3 max-w-sm text-center">
          <Lock className="h-10 w-10 text-rose-500 animate-pulse" />
          <h3 className="text-lg font-bold">Access Denied</h3>
          <p className="text-xs text-slate-400">
            You do not have the required administrative permissions to access the audit logs panel.
          </p>
          <Link href="/" className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg transition-colors">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="w-8 h-8 bg-sky-600 rounded-lg flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </span>
            DCBrain
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            AI Platform for Data Centre EPC
          </p>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          ))}
          <Link
            href="/admin/audit-log"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 bg-sky-500/10 text-sky-400 border border-sky-500/20"
          >
            <Lock className="w-5 h-5" />
            Audit Logs
          </Link>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors cursor-pointer"
          >
            <Lock className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-slate-900 border-b border-slate-800 px-8 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Database className="h-5 w-5 text-sky-400" />
              System Audit Logs
            </h2>
            <p className="text-xs text-slate-500">Immutable operations log and developer diagnostics</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => void loadAuditLogs()}
              disabled={loading}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-700 hover:bg-slate-800 px-3 text-xs font-medium text-slate-200 transition-colors cursor-pointer"
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              Sync logs
            </button>
            <div className="h-8 w-px bg-slate-800" />
            <NotificationBell />
          </div>
        </header>

        {/* Content Body */}
        <div className="p-8 space-y-6">
          {error && (
            <div className="p-4 rounded-xl border bg-rose-500/10 border-rose-500/20 text-rose-400 text-sm">
              {error}
            </div>
          )}

          {/* Filter Toolbar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <Search className="h-4 w-4 text-sky-400" />
              <span className="font-semibold text-slate-200">Query Filters</span>
            </div>

            <div className="flex flex-wrap gap-3">
              <input
                type="text"
                value={actionFilter}
                onChange={(e) => {
                  setActionFilter(e.target.value);
                  setPage(1);
                }}
                placeholder="Filter by action (e.g. auth.login)..."
                className="h-9 min-w-56 rounded-lg border border-slate-800 bg-slate-950 px-3 text-xs outline-none text-slate-300 placeholder-slate-600 focus:border-sky-500/50"
              />

              <input
                type="text"
                value={resourceFilter}
                onChange={(e) => {
                  setResourceFilter(e.target.value);
                  setPage(1);
                }}
                placeholder="Filter by resource type..."
                className="h-9 min-w-44 rounded-lg border border-slate-800 bg-slate-950 px-3 text-xs outline-none text-slate-300 placeholder-slate-600 focus:border-sky-500/50"
              />
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-slate-300 text-xs">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800/80 text-slate-400 font-semibold select-none">
                    <th className="p-4">Timestamp</th>
                    <th className="p-4">User</th>
                    <th className="p-4">Action</th>
                    <th className="p-4">Resource</th>
                    <th className="p-4">IP Address</th>
                    <th className="p-4 text-right">Payload</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {loading && logs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-16 text-center text-slate-500">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin text-sky-400" />
                          Loading audit records…
                        </div>
                      </td>
                    </tr>
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-16 text-center text-slate-500 border border-dashed border-slate-800/60 rounded-xl">
                        No audit records found matching the filter query.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-850/40 transition-colors">
                        <td className="p-4 font-mono text-slate-400 shrink-0">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="p-4">
                          {log.user ? (
                            <div className="flex flex-col gap-0.5">
                              <span className="font-semibold text-slate-200">{log.user.name}</span>
                              <span className="text-[10px] text-slate-500">{log.user.email}</span>
                            </div>
                          ) : (
                            <span className="text-slate-500 font-semibold italic">System</span>
                          )}
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-semibold tracking-wider font-mono uppercase ${getActionBadgeColor(log.action)}`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="p-4">
                          {log.resourceType ? (
                            <div className="flex flex-col gap-0.5">
                              <span className="font-semibold capitalize text-slate-200">{log.resourceType}</span>
                              <span className="text-[10px] font-mono text-slate-500">{log.resourceId || '—'}</span>
                            </div>
                          ) : (
                            <span className="text-slate-500 font-semibold">—</span>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-mono text-slate-300 flex items-center gap-1">
                              <Globe className="h-3 w-3 text-slate-500 shrink-0" />
                              {log.ipAddress || '127.0.0.1'}
                            </span>
                            <span className="text-[9px] text-slate-600 line-clamp-1 max-w-[200px]" title={log.userAgent ?? ''}>
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
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 border border-slate-700/50 hover:bg-slate-700 text-sky-400 font-semibold rounded-lg transition-colors cursor-pointer"
                            >
                              <Eye className="h-3 w-3" />
                              Explore
                            </button>
                          ) : (
                            <span className="text-slate-600 italic">None</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination controls */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-slate-800 flex items-center justify-between select-none">
                <span className="text-xs text-slate-500">
                  Showing page {page} of {totalPages} ({total} logs total)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-1 bg-slate-850 hover:bg-slate-800 disabled:opacity-40 rounded border border-slate-850 cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-1 bg-slate-850 hover:bg-slate-800 disabled:opacity-40 rounded border border-slate-850 cursor-pointer"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* JSON Details Explorer Modal */}
      {selectedDetails && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl text-slate-100">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <span className="font-semibold text-sm flex items-center gap-2">
                <Terminal className="h-4 w-4 text-sky-400" />
                {selectedDetailsTitle}
              </span>
              <button
                onClick={() => setSelectedDetails(null)}
                className="text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto font-mono text-xs text-emerald-400 bg-slate-950 select-text">
              <pre className="whitespace-pre-wrap">{JSON.stringify(selectedDetails, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AuditLogPage() {
  return (
    <ProtectedRoute>
      <AuditLogPageContent />
    </ProtectedRoute>
  );
}
