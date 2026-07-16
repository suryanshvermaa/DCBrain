'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  FileText,
  Shield,
  Calendar,
  Package,
  HelpCircle,
  Activity,
  RefreshCw,
  Loader2,
  Filter,
} from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import * as projectsApi from '@/lib/api/projects';
import * as auditApi from '@/lib/api/audit';
import { ApiError } from '@/lib/api';

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
  const [projects, setProjects] = useState<projectsApi.Project[]>([]);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [members, setMembers] = useState<projectsApi.ProjectMember[]>([]);
  const [activities, setActivities] = useState<auditApi.ProjectActivityEntry[]>([]);
  const [selectedType, setSelectedType] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const loadProjectData = useCallback(
    async (pid: string) => {
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
    },
    [selectedType, selectedUser],
  );

  useEffect(() => {
    if (projectId) {
      void loadProjectData(projectId);
    }
  }, [projectId, loadProjectData]);

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === projectId) ?? null,
    [projectId, projects],
  );

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'DOCUMENT_UPLOADED':
      case 'DOCUMENT_PROCESSED':
        return <FileText className="h-5 w-5 text-[var(--color-primary)] shrink-0" />;
      case 'COMPLIANCE_CHECKED':
        return <Shield className="h-5 w-5 text-[var(--color-success)] shrink-0" />;
      case 'SCHEDULE_UPDATED':
        return <Calendar className="h-5 w-5 text-[var(--color-danger)] shrink-0" />;
      case 'PROCUREMENT_CREATED':
        return <Package className="h-5 w-5 text-[var(--color-warning)] shrink-0" />;
      case 'RFI_CREATED':
        return <HelpCircle className="h-5 w-5 text-purple-500 shrink-0" />;
      default:
        return <Activity className="h-5 w-5 text-[var(--color-info)] shrink-0" />;
    }
  };

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
      <button
        onClick={() => projectId && void loadProjectData(projectId)}
        disabled={loading || !projectId}
        className="inline-flex h-9 items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface-hover)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
        Sync
      </button>
    </div>
  );

  return (
    <AppShell
      title="Project Activity Timeline"
      subtitle={selectedProject ? `${selectedProject.name} (${selectedProject.code})` : undefined}
      headerActions={headerActions}
    >
      <div className="p-8 max-w-5xl mx-auto w-full space-y-6">
        {error && (
          <div className="rounded-lg border border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] px-4 py-3 text-sm text-[var(--color-danger-text)]">
            {error}
          </div>
        )}

        {/* Filter toolbar */}
        <div className="card-level-1 flex flex-wrap items-center justify-between gap-4 p-5 transition-theme">
          <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
            <Filter className="h-4 w-4 text-[var(--color-primary)]" />
            <span className="font-semibold text-[var(--color-text-primary)]">Filters</span>
          </div>

          <div className="flex flex-wrap gap-3">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="h-9 min-w-44 rounded-lg border border-[var(--color-input)] bg-[var(--color-input-bg)] px-3 text-sm text-[var(--color-text-primary)] outline-none transition-colors focus:border-[var(--color-ring)] focus:ring-2 focus:ring-[var(--color-focus-ring)]"
            >
              {activityTypes.map((type) => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>

            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="h-9 min-w-44 rounded-lg border border-[var(--color-input)] bg-[var(--color-input-bg)] px-3 text-sm text-[var(--color-text-primary)] outline-none transition-colors focus:border-[var(--color-ring)] focus:ring-2 focus:ring-[var(--color-focus-ring)]"
            >
              <option value="">All Contributors</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>{member.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Timeline feed */}
        {loading && activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-[var(--color-text-secondary)]">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
            <span>Fetching activity history…</span>
          </div>
        ) : activities.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--color-border)] py-20 text-center text-sm text-[var(--color-text-secondary)]">
            No matching activity records found for this project.
          </div>
        ) : (
          <div className="relative ml-4 space-y-8 border-l border-[var(--color-border)] py-4 pl-8">
            {activities.map((activity) => (
              <div key={activity.id} className="group relative">
                {/* Timeline Dot */}
                <span className="absolute -left-[49px] top-1.5 flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-tertiary)] shadow-[var(--shadow-sm)] transition-all duration-300 group-hover:border-[var(--color-primary)] group-hover:text-[var(--color-primary)]">
                  {getActivityIcon(activity.type)}
                </span>

                {/* Activity card */}
                <div className="card-level-1 flex flex-col justify-between gap-4 p-5 transition-theme md:flex-row md:items-center">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                      {activity.title}
                    </p>
                    {activity.description && (
                      <p className="text-xs leading-relaxed text-[var(--color-text-secondary)]">
                        {activity.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 pt-1 text-[10px] text-[var(--color-text-tertiary)]">
                      <span className="font-medium text-[var(--color-text-secondary)]">
                        {activity.userName}
                      </span>
                      <span>·</span>
                      <span>{activity.userEmail}</span>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center justify-between gap-2 md:flex-col md:items-end">
                    <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-2.5 py-0.5 text-[10px] font-semibold tracking-wider text-[var(--color-text-secondary)]">
                      {new Date(activity.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span className="text-[10px] font-medium text-[var(--color-text-tertiary)]">
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
    </AppShell>
  );
}

export default function ActivityPage() {
  return (
    <ProtectedRoute>
      <ActivityPageContent />
    </ProtectedRoute>
  );
}
