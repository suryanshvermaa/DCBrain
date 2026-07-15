'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity,
  Bot,
  Calendar,
  ChevronRight,
  Download,
  Eye,
  FileBarChart,
  FileText,
  HelpCircle,
  LayoutDashboard,
  Loader2,
  Package,
  Plus,
  Search,
  Settings,
  Shield,
  X,
  Network
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import * as projectsApi from '@/lib/api/projects';
import * as reportsApi from '@/lib/api/reports';

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
  { name: 'Reports', href: '/reports', icon: FileBarChart },
  { name: 'Settings', href: '/settings', icon: Settings },
];

const REPORT_TYPE_LABELS: Record<reportsApi.ReportType, string> = {
  DAILY: 'Daily Status',
  WEEKLY: 'Weekly Summary',
  EXECUTIVE: 'Executive Briefing',
  COMPLIANCE: 'Compliance',
  RISK: 'Risk Assessment',
  PROCUREMENT: 'Procurement',
};

const REPORT_TYPE_COLORS: Record<reportsApi.ReportType, string> = {
  DAILY: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  WEEKLY: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  EXECUTIVE: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  COMPLIANCE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  RISK: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  PROCUREMENT: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
};

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  GENERATING: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  FAILED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

function formatFileSize(bytes: number | null): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function ReportsPageContent() {
  const pathname = usePathname();

  const [projects, setProjects] = useState<projectsApi.Project[]>([]);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [reports, setReports] = useState<reportsApi.ReportListItem[]>([]);
  const [totalReports, setTotalReports] = useState(0);
  const [selectedReport, setSelectedReport] = useState<reportsApi.ReportDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedType, setSelectedType] = useState<reportsApi.ReportType>('EXECUTIVE');
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    async function loadProjects() {
      try {
        const result = await projectsApi.listProjects();
        setProjects(result.projects);
        if (result.projects.length > 0) {
          setProjectId(result.projects[0].id);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to load projects';
        setError(message);
      }
    }
    void loadProjects();
  }, []);

  const loadReports = useCallback(async (pid: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await reportsApi.listReports(pid);
      setReports(result.reports);
      setTotalReports(result.total);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load reports';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (projectId) {
      void loadReports(projectId);
    }
  }, [projectId, loadReports]);

  const handleGenerate = async () => {
    if (!projectId) return;
    setGenerating(true);
    setError(null);
    try {
      await reportsApi.generateReport(projectId, selectedType, false);
      setShowGenerateModal(false);
      await loadReports(projectId);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to generate report';
      setError(message);
    } finally {
      setGenerating(false);
    }
  };

  const handleViewReport = async (reportId: string) => {
    if (!projectId) return;
    try {
      const detail = await reportsApi.getReport(projectId, reportId);
      setSelectedReport(detail);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load report';
      setError(message);
    }
  };

  const handleDownload = async (reportId: string, format: 'pdf' | 'md') => {
    if (!projectId) return;
    setDownloading(`${reportId}-${format}`);
    try {
      if (format === 'md') {
        const result = await reportsApi.downloadReport(projectId, reportId, format);
        if (result.markdown) {
          const blob = new Blob([result.markdown], { type: 'text/markdown' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = result.filename;
          a.click();
          URL.revokeObjectURL(url);
        }
      } else {
        const blob = await reportsApi.downloadPdfBlob(projectId, reportId);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        // Find report title or use default
        const report = reports.find((r) => r.id === reportId) || selectedReport;
        const safeTitle = report?.title.replace(/[^a-zA-Z0-9_-]/g, '_') || 'report';
        a.download = `${safeTitle}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Download failed';
      setError(message);
    } finally {
      setDownloading(null);
    }
  };

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === projectId) ?? null,
    [projectId, projects]
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex overflow-hidden">
      <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </span>
            DCBrain
          </h1>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-7xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <FileBarChart className="w-7 h-7 text-blue-600" />
                Reports
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                Generate, preview, and download project reports with AI-powered insights.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {projects.length > 0 && (
                <select
                  value={projectId ?? ''}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              )}

              <button
                onClick={() => setShowGenerateModal(true)}
                disabled={!projectId}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Generate Report
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Report Stats */}
          {selectedProject && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Reports</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{totalReports}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Completed</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {reports.filter((r) => r.status === 'COMPLETED').length}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Generating</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  {reports.filter((r) => r.status === 'PENDING' || r.status === 'GENERATING').length}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Failed</p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  {reports.filter((r) => r.status === 'FAILED').length}
                </p>
              </div>
            </div>
          )}

          {/* Reports Table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Report History</h3>
              {loading && <Loader2 className="w-5 h-5 animate-spin text-blue-600" />}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <th className="px-6 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Title</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Type</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Status</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Size</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Generated</th>
                    <th className="px-6 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {reports.map((report) => (
                    <tr key={report.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <FileBarChart className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-900 dark:text-white truncate max-w-[250px]">
                            {report.title}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${REPORT_TYPE_COLORS[report.type] ?? ''}`}>
                          {REPORT_TYPE_LABELS[report.type] ?? report.type}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs ${STATUS_COLORS[report.status] ?? ''}`}>
                          {report.status}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-gray-600 dark:text-gray-400">
                        {formatFileSize(report.fileSizeBytes)}
                      </td>
                      <td className="px-6 py-3 text-gray-600 dark:text-gray-400">
                        {report.generatedAt ? new Date(report.generatedAt).toLocaleString() : '—'}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {report.status === 'COMPLETED' && (
                            <>
                              <button
                                onClick={() => void handleViewReport(report.id)}
                                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
                                title="Preview"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => void handleDownload(report.id, 'pdf')}
                                disabled={downloading === `${report.id}-pdf`}
                                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-50"
                                title="Download PDF"
                              >
                                {downloading === `${report.id}-pdf` ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Download className="w-4 h-4" />
                                )}
                              </button>
                              <button
                                onClick={() => void handleDownload(report.id, 'md')}
                                disabled={downloading === `${report.id}-md`}
                                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-blue-600 dark:text-blue-400 disabled:opacity-50"
                                title="Download Markdown"
                              >
                                <FileText className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => void handleViewReport(report.id)}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 inline-flex items-center gap-1 text-xs"
                          >
                            Details <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {!loading && reports.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                        <FileBarChart className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="font-medium">No reports generated yet</p>
                        <p className="text-sm mt-1">Click &quot;Generate Report&quot; to create your first project report.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Generate Report Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-lg w-full shadow-2xl">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Generate Report</h3>
              <button
                onClick={() => setShowGenerateModal(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Report Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.entries(REPORT_TYPE_LABELS) as [reportsApi.ReportType, string][]).map(
                    ([type, label]) => (
                      <button
                        key={type}
                        onClick={() => setSelectedType(type)}
                        className={`px-3 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                          selectedType === type
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 ring-1 ring-blue-500'
                            : 'border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        {label}
                      </button>
                    )
                  )}
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 text-sm text-gray-600 dark:text-gray-400">
                {selectedType === 'DAILY' && 'Includes document status, compliance, schedule, procurement, and RFI sections.'}
                {selectedType === 'WEEKLY' && 'Full project summary with all sections including risk register and recommendations.'}
                {selectedType === 'EXECUTIVE' && 'High-level briefing with compliance, schedule, procurement risks, and recommendations.'}
                {selectedType === 'COMPLIANCE' && 'Focused compliance status report with findings and recommendations.'}
                {selectedType === 'RISK' && 'Risk assessment covering schedule, procurement, and mitigation recommendations.'}
                {selectedType === 'PROCUREMENT' && 'Procurement pipeline status with vendor performance and delay tracking.'}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => setShowGenerateModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => void handleGenerate()}
                disabled={generating}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileBarChart className="w-4 h-4" />
                    Generate
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Preview Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                  {selectedReport.title}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`inline-flex px-2 py-0.5 rounded text-xs ${REPORT_TYPE_COLORS[selectedReport.type] ?? ''}`}>
                    {REPORT_TYPE_LABELS[selectedReport.type]}
                  </span>
                  <span className={`inline-flex px-2 py-0.5 rounded text-xs ${STATUS_COLORS[selectedReport.status] ?? ''}`}>
                    {selectedReport.status}
                  </span>
                  {selectedReport.generatedBy && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      by {selectedReport.generatedBy.firstName} {selectedReport.generatedBy.lastName}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {selectedReport.status === 'COMPLETED' && (
                  <>
                    <button
                      onClick={() => void handleDownload(selectedReport.id, 'pdf')}
                      className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" /> PDF
                    </button>
                    <button
                      onClick={() => void handleDownload(selectedReport.id, 'md')}
                      className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5" /> MD
                    </button>
                  </>
                )}
                <button
                  onClick={() => setSelectedReport(null)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {selectedReport.error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-300 mb-4">
                  {selectedReport.error}
                </div>
              )}

              {selectedReport.markdownContent ? (
                <div className="prose dark:prose-invert max-w-none text-sm">
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-gray-700 dark:text-gray-300 bg-transparent p-0 border-none">
                    {selectedReport.markdownContent}
                  </pre>
                </div>
              ) : (
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                  {selectedReport.status === 'PENDING' || selectedReport.status === 'GENERATING'
                    ? 'Report is being generated...'
                    : 'No content available.'}
                </div>
              )}

              {selectedReport.metadata && (
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Report Metadata</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    {Object.entries(selectedReport.metadata).map(([key, value]) => (
                      <div key={key} className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-2">
                        <p className="text-gray-400">{key}</p>
                        <p className="font-medium text-gray-700 dark:text-gray-300">{String(value)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ReportsPage() {
  return (
    <ProtectedRoute>
      <ReportsPageContent />
    </ProtectedRoute>
  );
}
