'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
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
  User,
  Filter,
  ArrowRight,
  Lock,
} from 'lucide-react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import * as projectsApi from '@/lib/api/projects';
import * as auditApi from '@/lib/api/audit';
import { ApiError } from '@/lib/api';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { useAppSelector } from '@/lib/hooks';
import { selectAuthenticatedUser } from '@/features/auth/authSlice';

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

const activityTypes = [
  { value: '', label: 'All Activities' },
  { value: 'DOCUMENT_UPLOADED', label: 'Document Uploaded' },
  { value: 'DOCUMENT_PROCESSED', label: 'Document Processed' },
  { value: 'COMPLIANCE_CHECKED', label: 'Compliance Checked' },
  { value: 'SCHEDULE_UPDATED', label: 'Schedule Updated' },
  { value: 'PROCUREMENT_CREATED', label: 'Procurement Created' },
  { value: 'RFI_CREATED', label: 'RFI Created' },
  { value: 'NCR_CREATED', label: 'NCR Created' },
  { value: 'USER_JOINED', label: 'User Joined' },
];

function ActivityPageContent() {
  const user = useAppSelector(selectAuthenticatedUser);
  const [projects, setProjects] = useState<projectsApi.Project[]>([]);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [members, setMembers] = useState<projectsApi.ProjectMember[]>([]);
  const [activities, setActivities] = useState<auditApi.ProjectActivityEntry[]>([]);
  
  // Filters
  const [selectedType, setSelectedType] = useState('');
  const [selectedUser, setSelectedUser] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load projects on mount
  useEffect(() => {
    async function loadProjects() {
      try {
        const result = await projectsApi.listProjects();
        setProjects(result.projects);
        setProjectId((cur) => cur ?? result.projects[0]?.id ?? null);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Unable to load projects');
      }
    }
    void loadProjects();
  }, []);

  // Fetch project members and activities when project changes
  const loadProjectData = useCallback(async (pid: string) => {
    setLoading(true);
    setError(null);
    try {
      const [membersRes, activitiesRes] = await Promise.all([
        projectsApi.getProjectMembers(pid),
        auditApi.listProjectActivity(pid, {
          type: selectedType || undefined,
          userId: selectedUser || undefined,
        }),
      ]);
      setMembers(membersRes.members);
      setActivities(activitiesRes.activities);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to load project activities');
    } finally {
      setLoading(false);
    }
  }, [selectedType, selectedUser]);

  useEffect(() => {
    if (projectId) {
      void loadProjectData(projectId);
    }
  }, [projectId, loadProjectData]);

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === projectId) ?? null,
    [projectId, projects]
  );

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'DOCUMENT_UPLOADED':
      case 'DOCUMENT_PROCESSED':
        return <FileText className="h-5 w-5 text-blue-400 shrink-0" />;
      case 'COMPLIANCE_CHECKED':
        return <Shield className="h-5 w-5 text-emerald-400 shrink-0" />;
      case 'SCHEDULE_UPDATED':
        return <Calendar className="h-5 w-5 text-rose-400 shrink-0" />;
      case 'PROCUREMENT_CREATED':
        return <Package className="h-5 w-5 text-amber-400 shrink-0" />;
      case 'RFI_CREATED':
        return <HelpCircle className="h-5 w-5 text-purple-400 shrink-0" />;
      default:
        return <Activity className="h-5 w-5 text-sky-400 shrink-0" />;
    }
  };

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
          {navigation.map((item) => {
            const active = item.href === '/'; // We highlight dashboard since activity is sub-view
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  active
                    ? 'bg-slate-800 text-sky-400 border border-slate-700/50'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
          {user?.role === 'ADMIN' && (
            <Link
              href="/admin/audit-log"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            >
              <Lock className="w-5 h-5" />
              Audit Logs
            </Link>
          )}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-slate-900 border-b border-slate-800 px-8 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Project Activity Timeline</h2>
            {selectedProject && (
              <p className="text-xs text-slate-500 mt-0.5">
                {selectedProject.name} ({selectedProject.code})
              </p>
            )}
          </div>
          <div className="flex items-center gap-4">
            {/* Project selector */}
            <select
              className="h-9 min-w-48 rounded-lg border border-slate-700 bg-slate-850 px-3 text-xs outline-none text-slate-200"
              value={projectId ?? ''}
              onChange={(e) => setProjectId(e.target.value || null)}
            >
              {projects.length === 0 ? <option value="">No projects</option> : null}
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            <button
              onClick={() => projectId && void loadProjectData(projectId)}
              disabled={loading || !projectId}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-700 hover:bg-slate-800 px-3 text-xs font-medium text-slate-200 transition-colors cursor-pointer"
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              Sync
            </button>

            <div className="h-8 w-px bg-slate-800" />
            <NotificationBell />
          </div>
        </header>

        {/* Content Body */}
        <div className="p-8 max-w-5xl mx-auto w-full space-y-6">
          {error && (
            <div className="p-4 rounded-xl border bg-rose-500/10 border-rose-500/20 text-rose-400 text-sm">
              {error}
            </div>
          )}

          {/* Filter Toolbar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <Filter className="h-4 w-4 text-sky-400" />
              <span className="font-semibold text-slate-200">Filters</span>
            </div>

            <div className="flex flex-wrap gap-3">
              {/* Type Filter */}
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="h-9 min-w-44 rounded-lg border border-slate-800 bg-slate-950 px-3 text-xs outline-none text-slate-300"
              >
                {activityTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>

              {/* User Filter */}
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="h-9 min-w-44 rounded-lg border border-slate-800 bg-slate-950 px-3 text-xs outline-none text-slate-300"
              >
                <option value="">All Contributors</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Timeline Feed */}
          {loading && activities.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-500 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-sky-400" />
              <span>Fetching activity history…</span>
            </div>
          ) : activities.length === 0 ? (
            <div className="py-20 bg-slate-900 border border-slate-800 border-dashed rounded-2xl text-center text-slate-500 text-sm">
              No matching activity records found for this project.
            </div>
          ) : (
            <div className="relative border-l border-slate-800 ml-4 pl-8 space-y-8 py-4">
              {activities.map((activity) => (
                <div key={activity.id} className="relative group">
                  {/* Timeline Dot & Icon */}
                  <span className="absolute -left-[49px] top-1.5 flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 border border-slate-800 text-slate-400 group-hover:border-sky-500/50 group-hover:text-sky-400 transition-all duration-300 shadow-lg">
                    {getActivityIcon(activity.type)}
                  </span>

                  {/* Activity Card */}
                  <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700/50 transition-all duration-200 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <p className="font-semibold text-sm text-slate-200">{activity.title}</p>
                      {activity.description && (
                        <p className="text-xs text-slate-400 font-normal leading-relaxed">
                          {activity.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 pt-1">
                        <span className="font-medium text-slate-400">{activity.userName}</span>
                        <span>·</span>
                        <span>{activity.userEmail}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:flex-col md:items-end shrink-0 gap-2">
                      <span className="text-[10px] text-slate-400 font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700/40 tracking-wider">
                        {new Date(activity.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {new Date(activity.createdAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function ActivityPage() {
  return (
    <ProtectedRoute>
      <ActivityPageContent />
    </ProtectedRoute>
  );
}
