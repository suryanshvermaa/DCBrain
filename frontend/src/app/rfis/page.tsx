'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Activity,
  HelpCircle,
  Plus,
  LayoutDashboard,
  FileText,
  Search,
  Bot,
  Shield,
  Calendar,
  Settings,
  Loader2,
  AlertTriangle,
  User,
  Clock,
  CheckCircle,
  FileUp,
  Tag,
  ThumbsUp,
  ArrowRight,
  Filter,
  CheckSquare,
  Bookmark,
  Network,
  BarChart3,
  Package as PackageIcon
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import * as projectsApi from '@/lib/api/projects';
import * as documentsApi from '@/lib/api/documents';
import * as rfisApi from '@/lib/api/rfis';


function RfisPageContent() {
  const pathname = usePathname();

  // Project states
  const [projects, setProjects] = useState<projectsApi.Project[]>([]);
  const [projectId, setProjectId] = useState<string | null>(null);

  // RFI data states
  const [rfis, setRfis] = useState<rfisApi.RfiResponse[]>([]);
  const [selectedRfi, setSelectedRfi] = useState<rfisApi.RfiResponse | null>(null);
  const [members, setMembers] = useState<projectsApi.ProjectMember[]>([]);
  const [documents, setDocuments] = useState<documentsApi.ProjectDocument[]>([]);
  const [analytics, setAnalytics] = useState<rfisApi.RfiAnalyticsResponse | null>(null);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [overdueFilter, setOverdueFilter] = useState<boolean | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [generatingAnswer, setGeneratingAnswer] = useState(false);
  const [approving, setApproving] = useState(false);

  // New RFI form state
  const [newSubject, setNewSubject] = useState('');
  const [newQuestion, setNewQuestion] = useState('');
  const [newPriority, setNewPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('MEDIUM');
  const [newDiscipline, setNewDiscipline] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newAssigneeId, setNewAssigneeId] = useState('');
  const [newDocumentIds, setNewDocumentIds] = useState<string[]>([]);

  // Answer approval form state
  const [officialResolution, setOfficialResolution] = useState('');

  // Initial load
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

  // Load project-scoped details
  const loadProjectDetails = useCallback(async (pid: string) => {
    try {
      const [membersRes, docsRes] = await Promise.all([
        projectsApi.getProjectMembers(pid),
        documentsApi.listDocuments(pid, { pageSize: 100 })
      ]);
      setMembers(membersRes.members);
      setDocuments(docsRes.documents);
    } catch (err) {
      console.error('Failed to load project members/docs:', err);
    }
  }, []);

  // Load RFIs & Analytics
  const loadRfiData = useCallback(async (pid: string, status?: string, overdue?: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const [rfisRes, analyticsRes] = await Promise.all([
        rfisApi.listRfis(pid, { status, overdue }),
        rfisApi.getRfiAnalytics(pid)
      ]);
      setRfis(rfisRes.rfis);
      setAnalytics(analyticsRes);

      // Keep selected RFI fresh if it exists
      setSelectedRfi((prev) => {
        if (!prev) return null;
        const updated = rfisRes.rfis.find((r) => r.id === prev.id);
        if (updated) {
          setOfficialResolution(updated.resolution || updated.suggestedAnswer || '');
          return updated;
        }
        return prev;
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load RFI data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle Project Change
  useEffect(() => {
    if (projectId) {
      void loadProjectDetails(projectId);
      void loadRfiData(projectId, statusFilter || undefined, overdueFilter);
      setSelectedRfi(null);
      setOfficialResolution('');
    }
  }, [projectId, statusFilter, overdueFilter, loadProjectDetails, loadRfiData]);

  // Handle RFI Selection
  const handleSelectRfi = async (rfi: rfisApi.RfiResponse) => {
    if (!projectId) return;
    setLoadingDetail(true);
    try {
      const details = await rfisApi.getRfi(projectId, rfi.id);
      setSelectedRfi(details);
      setOfficialResolution(details.resolution || details.suggestedAnswer || '');
    } catch (err: any) {
      alert(err.message || 'Failed to fetch RFI details');
    } finally {
      setLoadingDetail(false);
    }
  };

  // Create RFI
  const handleCreateRfi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !newSubject.trim() || !newQuestion.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const payload = {
        subject: newSubject,
        question: newQuestion,
        priority: newPriority,
        discipline: newDiscipline || undefined,
        dueDate: newDueDate ? new Date(newDueDate).toISOString() : null,
        assigneeId: newAssigneeId || null,
        documentIds: newDocumentIds
      };

      const created = await rfisApi.createRfi(projectId, payload);
      setCreateModalOpen(false);

      // Reset form
      setNewSubject('');
      setNewQuestion('');
      setNewPriority('MEDIUM');
      setNewDiscipline('');
      setNewDueDate('');
      setNewAssigneeId('');
      setNewDocumentIds([]);

      // Reload
      await loadRfiData(projectId, statusFilter || undefined, overdueFilter);
      setSelectedRfi(created);
      setOfficialResolution('');
    } catch (err: any) {
      setError(err.message || 'Failed to create RFI');
    } finally {
      setLoading(false);
    }
  };

  // Run AI Suggestion Pipeline
  const handleSuggestAnswer = async () => {
    if (!projectId || !selectedRfi) return;

    setGeneratingAnswer(true);
    try {
      const updated = await rfisApi.suggestRfiAnswer(projectId, selectedRfi.id);
      setSelectedRfi(updated);
      setOfficialResolution(updated.resolution || updated.suggestedAnswer || '');
      // Refresh list
      void loadRfiData(projectId, statusFilter || undefined, overdueFilter);
    } catch (err: any) {
      alert(err.message || 'Failed to generate AI response');
    } finally {
      setGeneratingAnswer(false);
    }
  };

  // Submit/Approve Answer
  const handleApproveAnswer = async () => {
    if (!projectId || !selectedRfi || !officialResolution.trim()) return;

    setApproving(true);
    try {
      const updated = await rfisApi.updateRfi(projectId, selectedRfi.id, {
        resolution: officialResolution,
        status: 'ANSWERED'
      });
      setSelectedRfi(updated);
      setOfficialResolution(updated.resolution || '');
      // Refresh list
      void loadRfiData(projectId, statusFilter || undefined, overdueFilter);
    } catch (err: any) {
      alert(err.message || 'Failed to submit response');
    } finally {
      setApproving(false);
    }
  };

  // Close or transition status
  const handleTransitionStatus = async (newStatus: 'OPEN' | 'IN_REVIEW' | 'CLOSED' | 'VOID') => {
    if (!projectId || !selectedRfi) return;

    setApproving(true);
    try {
      const updated = await rfisApi.updateRfi(projectId, selectedRfi.id, {
        status: newStatus
      });
      setSelectedRfi(updated);
      // Refresh list
      void loadRfiData(projectId, statusFilter || undefined, overdueFilter);
    } catch (err: any) {
      alert(err.message || 'Failed to transition status');
    } finally {
      setApproving(false);
    }
  };

  const selectedProject = useMemo(() => projects.find((p) => p.id === projectId) ?? null, [projectId, projects]);

  const filteredRfis = useMemo(() => {
    if (!searchQuery.trim()) return rfis;
    const q = searchQuery.toLowerCase();
    return rfis.filter((r) => 
      r.number.toLowerCase().includes(q) ||
      r.subject.toLowerCase().includes(q) ||
      r.question.toLowerCase().includes(q) ||
      (r.assignee && r.assignee.name.toLowerCase().includes(q))
    );
  }, [rfis, searchQuery]);

  const getPriorityColor = (p: string) => {
    switch(p) {
      case 'CRITICAL': return 'status-danger';
      case 'HIGH': return 'status-warning';
      case 'MEDIUM': return 'status-info';
      default: return 'bg-[var(--color-badge-default-bg)] text-[var(--color-badge-default-text)] border border-[var(--color-border)]';
    }
  };

  const getStatusColor = (s: string) => {
    switch(s) {
      case 'ANSWERED': return 'status-success';
      case 'CLOSED': return 'bg-[var(--color-badge-default-bg)] text-[var(--color-badge-default-text)] border border-[var(--color-border)]';
      case 'IN_REVIEW': return 'status-warning';
      case 'VOID': return 'status-danger';
      default: return 'status-info'; // OPEN
    }
  };

  const toggleDocumentLink = (docId: string) => {
    setNewDocumentIds((prev) =>
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
    );
  };

  const headerActions = (
    <div className="flex items-center gap-3">
      <select
        className="h-9 min-w-48 rounded-lg border border-[var(--color-input)] bg-[var(--color-input-bg)] px-3 text-sm outline-none text-[var(--color-text-primary)] transition-colors focus:border-[var(--color-ring)] focus:ring-2 focus:ring-[var(--color-focus-ring)]"
        value={projectId ?? ''}
        onChange={(e) => setProjectId(e.target.value || null)}
      >
        {projects.length === 0 ? <option value="">No projects</option> : null}
        {projects.map((p) => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>

      <button
        onClick={() => setCreateModalOpen(true)}
        className="inline-flex h-9 items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 text-sm font-medium text-white transition-colors hover:bg-[var(--color-primary-hover)]"
      >
        <Plus className="h-4 w-4" />
        New RFI
      </button>
    </div>
  );

  return (
    <AppShell
      title="RFI Intelligence"
      subtitle={selectedProject ? `${selectedProject.name} (${selectedProject.code})` : 'Track and resolve requests for information'}
      headerActions={headerActions}
    >
        <div className="flex-1 flex flex-col overflow-hidden min-h-[calc(100vh-4rem)] p-8 space-y-6">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shrink-0">
                {error}
              </div>
            )}

            {/* Quick Analytics Cards */}
            {analytics && (
              <section className="grid gap-4 sm:grid-cols-4 shrink-0">
                <div className="rounded-xl card-level-1 p-5">
                  <span className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase">Total RFIs</span>
                  <p className="text-3xl font-bold mt-1 text-[var(--color-text-primary)]">{analytics.total}</p>
                </div>
                <div className="rounded-xl card-level-1 p-5">
                  <span className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase">Open / In-Review</span>
                  <p className="text-3xl font-bold mt-1 text-amber-600">{analytics.open}</p>
                </div>
                <div className="rounded-xl card-level-1 p-5">
                  <span className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase">Overdue RFIs</span>
                  <p className="text-3xl font-bold mt-1 text-red-600">{analytics.overdue}</p>
                </div>
                <div className="rounded-xl card-level-1 p-5">
                  <span className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase">Avg Resolution Days</span>
                  <p className="text-3xl font-bold mt-1 text-green-600">
                    {analytics.avgResolutionDays !== null ? `${analytics.avgResolutionDays} days` : 'N/A'}
                  </p>
                </div>
              </section>
            )}

            {/* Filter and Content Panel */}
            <div className="flex-1 flex gap-6 overflow-hidden min-h-0">
              {/* Left Side: RFI List */}
              <div className="w-1/2 card-level-1 transition-theme flex flex-col overflow-hidden">
                {/* Search & Filter Header */}
                <div className="p-4 border-b border-[var(--color-border)] space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--color-text-tertiary)]" />
                    <input
                      type="text"
                      placeholder="Search RFI number, subject, query..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-[var(--color-input)] bg-transparent rounded-lg text-sm outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase mr-1">Status:</span>
                    <button
                      onClick={() => setStatusFilter('')}
                      className={`px-3 py-1 rounded-full text-xs font-medium border ${
                        statusFilter === ''
                          ? 'bg-[var(--color-primary-100)] border-[var(--color-primary)] text-[var(--color-primary)]'
                          : 'border-[var(--color-border)]'
                      }`}
                    >
                      All
                    </button>
                    {['OPEN', 'IN_REVIEW', 'ANSWERED', 'CLOSED', 'VOID'].map((st) => (
                      <button
                        key={st}
                        onClick={() => setStatusFilter(st)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border capitalize ${
                          statusFilter === st
                            ? 'bg-[var(--color-primary-100)] border-[var(--color-primary)] text-[var(--color-primary)]'
                            : 'border-[var(--color-border)]'
                        }`}
                      >
                        {st.replace('_', ' ').toLowerCase()}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="inline-flex items-center gap-2 text-xs font-medium text-[var(--color-text-secondary)] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={overdueFilter === true}
                        onChange={(e) => setOverdueFilter(e.target.checked ? true : undefined)}
                        className="rounded border-[var(--color-input)] text-blue-600 outline-none"
                      />
                      Show Overdue Only
                    </label>
                  </div>
                </div>

                {/* List Body */}
                <div className="flex-1 overflow-y-auto divide-y divide-[var(--color-divider)]">
                  {loading ? (
                    <div className="flex items-center justify-center p-8 text-sm text-gray-500">
                      <Loader2 className="animate-spin h-5 w-5 mr-2" />
                      Loading RFIs...
                    </div>
                  ) : filteredRfis.length === 0 ? (
                    <div className="p-8 text-center text-sm text-[var(--color-text-tertiary)]">
                      No Requests for Information matched these filters.
                    </div>
                  ) : (
                    filteredRfis.map((rfi) => {
                      const isSelected = selectedRfi?.id === rfi.id;
                      return (
                        <div
                          key={rfi.id}
                          onClick={() => handleSelectRfi(rfi)}
                          className={`p-4 cursor-pointer transition-colors text-left flex flex-col gap-2 ${
                            isSelected
                              ? 'bg-[var(--color-sidebar-active)] border-l-4 border-[var(--color-primary)]'
                              : 'hover:bg-[var(--color-surface-hover)] transition-colors'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[var(--color-text-tertiary)]">{rfi.number}</span>
                            <div className="flex gap-2">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider border uppercase ${getPriorityColor(rfi.priority)}`}>
                                {rfi.priority}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider border uppercase ${getStatusColor(rfi.status)}`}>
                                {rfi.status}
                              </span>
                            </div>
                          </div>

                          <h4 className="text-sm font-semibold text-[var(--color-text-primary)] line-clamp-1">
                            {rfi.subject}
                          </h4>
                          
                          <p className="text-xs text-gray-500 line-clamp-2">
                            {rfi.question}
                          </p>

                          <div className="flex items-center justify-between text-[11px] text-[var(--color-text-tertiary)] mt-1">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {rfi.assignee ? `Assignee: ${rfi.assignee.name}` : 'Unassigned'}
                            </span>
                            {rfi.dueDate && (
                              <span className={`flex items-center gap-1 ${rfi.overdue ? 'text-red-500 font-medium' : ''}`}>
                                <Clock className="h-3 w-3" />
                                Due: {new Date(rfi.dueDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right Side: RFI Detail View */}
              <div className="w-1/2 card-level-1 transition-theme flex flex-col overflow-hidden">
                {loadingDetail ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-sm text-gray-500">
                    <Loader2 className="animate-spin h-8 w-8 text-blue-600 mb-2" />
                    Loading RFI details...
                  </div>
                ) : selectedRfi ? (
                  <div className="flex-1 flex flex-col overflow-hidden text-left">
                    {/* Detail Header */}
                    <div className="p-6 border-b border-[var(--color-border)] space-y-3 shrink-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-[var(--color-text-tertiary)]">{selectedRfi.number}</span>
                        <div className="flex gap-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${getPriorityColor(selectedRfi.priority)}`}>
                            {selectedRfi.priority}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${getStatusColor(selectedRfi.status)}`}>
                            {selectedRfi.status}
                          </span>
                        </div>
                      </div>

                      <h3 className="text-lg font-bold text-[var(--color-text-primary)]">
                        {selectedRfi.subject}
                      </h3>

                      <div className="grid grid-cols-2 gap-4 text-xs border-t border-[var(--color-border)] pt-3">
                        <div className="space-y-1">
                          <p className="text-[var(--color-text-tertiary)]">Raised By</p>
                          <p className="font-semibold text-[var(--color-text-primary)]">
                            {typeof selectedRfi.raisedBy === 'object' ? selectedRfi.raisedBy?.name || 'Unknown' : (selectedRfi.raisedBy || 'Unknown')}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[var(--color-text-tertiary)]">Assigned To</p>
                          <p className="font-semibold text-[var(--color-text-primary)]">
                            {typeof selectedRfi.assignee === 'object' ? selectedRfi.assignee?.name || 'Unassigned' : (selectedRfi.assignee || 'Unassigned')}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[var(--color-text-tertiary)]">Discipline</p>
                          <p className="font-semibold text-[var(--color-text-primary)] capitalize">{selectedRfi.discipline || 'General'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[var(--color-text-tertiary)]">Due Date</p>
                          <p className={`font-semibold ${selectedRfi.overdue ? 'text-red-500' : 'text-[var(--color-text-primary)]'}`}>
                            {selectedRfi.dueDate ? new Date(selectedRfi.dueDate).toLocaleDateString() : 'None'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Detail Body */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                      {/* Question Section */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]">Question</h4>
                        <div className="bg-[var(--color-surface-raised)] rounded-lg p-4 text-sm text-[var(--color-text-secondary)] whitespace-pre-wrap">
                          {selectedRfi.question}
                        </div>
                      </div>

                      {/* Linked Documents */}
                      {Array.isArray(selectedRfi.documents) && selectedRfi.documents.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]">Linked Reference Documents</h4>
                          <div className="space-y-2">
                            {selectedRfi.documents.map((doc, i) => (
                              <div
                                key={doc?.documentId || i}
                                className="flex items-center justify-between border border-[var(--color-border)] rounded-lg p-3 text-xs bg-[var(--color-surface)]"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <FileText className="h-4 w-4 text-blue-500 shrink-0" />
                                  <span className="font-medium text-[var(--color-text-primary)] truncate">
                                    {doc?.originalName || doc?.filename || 'Document'}
                                  </span>
                                </div>
                                {doc?.documentId && (
                                  <a
                                    href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/projects/${projectId}/documents/${doc.documentId}/download-url`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline shrink-0 ml-2"
                                  >
                                    Download
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* AI Answer Generation */}
                      <div className="border border-[var(--color-primary)] bg-[var(--color-primary-100)] rounded-lg p-5 space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-[var(--color-primary)] flex items-center gap-1.5">
                            <Bot className="h-4 w-4 text-blue-600" />
                            AI Suggested Draft Response
                          </h4>
                          <button
                            onClick={handleSuggestAnswer}
                            disabled={generatingAnswer || selectedRfi.status === 'CLOSED'}
                            className="text-xs bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-medium px-3 py-1.5 rounded-lg flex items-center gap-1 disabled:opacity-50"
                          >
                            {generatingAnswer ? (
                              <>
                                <Loader2 className="animate-spin h-3.5 w-3.5" />
                                Analyzing...
                              </>
                            ) : (
                              <>
                                <RefreshCwIcon className="h-3.5 w-3.5" />
                                Generate Draft
                              </>
                            )}
                          </button>
                        </div>

                        {selectedRfi.suggestedAnswer ? (
                          <div className="space-y-4 text-xs">
                            <div className="bg-[var(--color-surface)] border border-blue-50 dark:border-blue-900 rounded-lg p-3 text-[var(--color-text-secondary)] whitespace-pre-wrap">
                              {selectedRfi.suggestedAnswer}
                            </div>

                            {Array.isArray(selectedRfi.suggestedSources) && selectedRfi.suggestedSources.length > 0 && (
                              <div className="space-y-2">
                                <p className="font-semibold text-gray-500 uppercase tracking-wider">Citations & RAG Sources</p>
                                <div className="space-y-2">
                                  {selectedRfi.suggestedSources.map((source, index) => (
                                    <div
                                      key={index}
                                      className="border border-[var(--color-border)] rounded-lg p-3 bg-[var(--color-surface)] text-[11px] space-y-1.5"
                                    >
                                      <div className="flex items-center justify-between text-[var(--color-text-tertiary)]">
                                        <span className="font-bold flex items-center gap-1">
                                          <Bookmark className="h-3.5 w-3.5 text-amber-500" />
                                          {source?.documentName || 'Document'}
                                        </span>
                                        <span className="bg-[var(--color-primary-100)] text-[var(--color-primary)] px-1.5 py-0.5 rounded text-[10px] font-bold">
                                          {((Number(source?.relevanceScore) || 0) * 100).toFixed(0)}% Match
                                        </span>
                                      </div>
                                      <p className="text-[var(--color-text-secondary)] italic whitespace-pre-wrap">
                                        &ldquo;{source?.excerpt || ''}&rdquo;
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-500">
                            No draft answer generated yet. Click "Generate Draft" to utilize DCBrain's hybrid RAG search over linked or project documents.
                          </p>
                        )}
                      </div>

                      {/* Official Resolution Section */}
                      {selectedRfi.status !== 'CLOSED' && selectedRfi.status !== 'VOID' ? (
                        <div className="space-y-3 border-t border-[var(--color-border)] pt-5">
                          <h4 className="text-sm font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]">Human Approval & Resolution</h4>
                          <textarea
                            value={officialResolution}
                            onChange={(e) => setOfficialResolution(e.target.value)}
                            placeholder="Enter the official answer for this RFI. You can copy-paste and edit the AI suggested draft response above."
                            rows={5}
                            className="w-full p-3 border border-[var(--color-input)] rounded-lg bg-transparent text-sm outline-none resize-y"
                          />
                          <div className="flex items-center gap-3">
                            <button
                              onClick={handleApproveAnswer}
                              disabled={approving || !officialResolution.trim()}
                              className="bg-green-600 hover:bg-green-700 text-white font-semibold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 disabled:opacity-50"
                            >
                              {approving ? <Loader2 className="animate-spin h-3.5 w-3.5" /> : <ThumbsUp className="h-3.5 w-3.5" />}
                              Approve &amp; Answer
                            </button>
                            {selectedRfi.status === 'ANSWERED' && (
                              <button
                                onClick={() => handleTransitionStatus('CLOSED')}
                                disabled={approving}
                                className="bg-[var(--color-surface-raised)] hover:bg-[var(--color-surface-hover)] text-[var(--color-text-primary)] text-white font-semibold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5"
                              >
                                Close RFI
                              </button>
                            )}
                            <button
                              onClick={() => handleTransitionStatus('VOID')}
                              disabled={approving}
                              className="border border-red-200 text-red-600 hover:bg-red-50 font-semibold text-xs px-4 py-2 rounded-lg"
                            >
                              Void RFI
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2 border-t border-[var(--color-border)] pt-5">
                          <h4 className="text-sm font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]">Official Approved Answer</h4>
                          <div className="bg-green-50/50 dark:bg-green-900/10 border border-green-200 rounded-lg p-4 text-sm text-[var(--color-text-secondary)]">
                            {selectedRfi.resolution || 'No answer recorded.'}
                          </div>
                          {selectedRfi.answeredAt && (
                            <p className="text-[11px] text-[var(--color-text-tertiary)]">
                              Answered by {selectedRfi.answeredBy?.name} on {new Date(selectedRfi.answeredAt).toLocaleString()}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-sm text-[var(--color-text-tertiary)]">
                    <HelpCircle className="h-10 w-10 text-gray-300 mb-2" />
                    Select an RFI from the list to view full details and suggestions.
                  </div>
                )}
              </div>
            </div>
          </div>

      {/* New RFI Dialog Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-[var(--color-surface)] rounded-xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-lg overflow-hidden text-left">
            <header className="p-6 border-b border-[var(--color-border)] flex justify-between items-center shrink-0">
              <h3 className="text-lg font-bold text-[var(--color-text-primary)]">Create Request for Information</h3>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="text-[var(--color-text-tertiary)] hover:text-gray-600 text-lg"
              >
                &times;
              </button>
            </header>

            <form onSubmit={handleCreateRfi} className="flex-1 overflow-y-auto p-6 space-y-4">
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
                  {error}
                </div>
              )}
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-[var(--color-text-tertiary)]">Subject</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AHU compliance with ASHRAE standards"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="w-full p-2.5 border border-[var(--color-input)] bg-transparent rounded-lg text-sm outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-[var(--color-text-tertiary)]">Question / Details</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe your inquiry or discrepancy in detail..."
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  className="w-full p-2.5 border border-[var(--color-input)] bg-transparent rounded-lg text-sm outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-[var(--color-text-tertiary)]">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full p-2.5 border border-[var(--color-input)] bg-transparent rounded-lg text-sm outline-none"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-[var(--color-text-tertiary)]">Discipline</label>
                  <input
                    type="text"
                    placeholder="e.g. Electrical, Mechanical"
                    value={newDiscipline}
                    onChange={(e) => setNewDiscipline(e.target.value)}
                    className="w-full p-2.5 border border-[var(--color-input)] bg-transparent rounded-lg text-sm outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-[var(--color-text-tertiary)]">Assignee</label>
                  <select
                    value={newAssigneeId}
                    onChange={(e) => setNewAssigneeId(e.target.value)}
                    className="w-full p-2.5 border border-[var(--color-input)] bg-transparent rounded-lg text-sm outline-none"
                  >
                    <option value="">Unassigned</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>{m.name} ({m.role.toLowerCase()})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-[var(--color-text-tertiary)]">Due Date</label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full p-2.5 border border-[var(--color-input)] bg-transparent rounded-lg text-sm outline-none"
                  />
                </div>
              </div>

              {/* Document Linking Checklist */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-[var(--color-text-tertiary)]">Link Reference Documents</label>
                {documents.length === 0 ? (
                  <p className="text-xs text-[var(--color-text-tertiary)] italic">No project documents available to link.</p>
                ) : (
                  <div className="border border-[var(--color-border)] rounded-lg max-h-32 overflow-y-auto divide-y divide-[var(--color-divider)]">
                    {documents.map((doc) => {
                      const isLinked = newDocumentIds.includes(doc.id);
                      return (
                        <div
                          key={doc.id}
                          onClick={() => toggleDocumentLink(doc.id)}
                          className="flex items-center gap-2 p-2 hover:bg-[var(--color-surface-hover)] transition-colors text-xs cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={isLinked}
                            readOnly
                            className="rounded border-[var(--color-input)] text-blue-600"
                          />
                          <span className="font-medium text-[var(--color-text-secondary)] truncate">{doc.originalName}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <footer className="pt-4 border-t border-[var(--color-border)] flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 border border-[var(--color-input)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-colors text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-xs font-semibold rounded-lg"
                >
                  Submit RFI
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}

export default function RfisPage() {
  return (
    <ProtectedRoute>
      <RfisPageContent />
    </ProtectedRoute>
  );
}

function RefreshCwIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 16h5v5" />
    </svg>
  );
}
