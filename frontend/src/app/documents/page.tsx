'use client';

import { useEffect, useMemo, useState } from 'react';
import { FileText, FolderPlus, Loader2, Plus, RefreshCw } from 'lucide-react';
import { CreateProjectModal } from '@/components/documents/CreateProjectModal';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { DocumentFilterBar } from '@/components/documents/DocumentFilterBar';
import { DocumentList } from '@/components/documents/DocumentList';
import { DocumentPreview } from '@/components/documents/DocumentPreview';
import { DocumentUploadModal } from '@/components/documents/DocumentUploadModal';
import { useDocuments } from '@/hooks/useDocuments';
import { ApiError } from '@/lib/api';
import * as documentsApi from '@/lib/api/documents';
import * as projectsApi from '@/lib/api/projects';

function DocumentsPageContent() {
  const [projects, setProjects] = useState<projectsApi.Project[]>([]);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projectError, setProjectError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [creatingProject, setCreatingProject] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [actionError, setActionError] = useState<string | null>(null);

  const { documents, selectedDocument, setSelectedDocument, loading, error, pagination, reload } =
    useDocuments(projectId);

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === projectId) ?? null,
    [projectId, projects],
  );

  useEffect(() => {
    async function loadProjects(): Promise<void> {
      try {
        const result = await projectsApi.listProjects();
        setProjects(result.projects);
        setProjectId((current) => current ?? result.projects[0]?.id ?? null);
      } catch (requestError) {
        setProjectError(
          requestError instanceof ApiError ? requestError.message : 'Unable to load projects',
        );
      }
    }
    void loadProjects();
  }, []);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      void reload({ search, category, status });
    }, 250);
    return () => window.clearTimeout(handle);
  }, [category, reload, search, status]);

  async function handleUpload(files: File[], uploadCategory: string): Promise<void> {
    if (!projectId) {
      setActionError('Select a project before uploading documents');
      return;
    }
    setUploading(true);
    setUploadProgress(0);
    setActionError(null);
    try {
      await documentsApi.uploadDocuments(projectId, files, uploadCategory, setUploadProgress);
      setUploadOpen(false);
      await reload({ search, category, status });
    } catch (requestError) {
      setActionError(
        requestError instanceof ApiError ? requestError.message : 'Unable to upload documents',
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleCreateProject(payload: projectsApi.CreateProjectPayload): Promise<void> {
    setCreatingProject(true);
    setActionError(null);
    try {
      const result = await projectsApi.createProject(payload);
      setProjects((current) => [
        result.project,
        ...current.filter((project) => project.id !== result.project.id),
      ]);
      setProjectId(result.project.id);
      setCreateProjectOpen(false);
    } catch (requestError) {
      setActionError(
        requestError instanceof ApiError ? requestError.message : 'Unable to create project',
      );
    } finally {
      setCreatingProject(false);
    }
  }

  async function handleDownload(document: documentsApi.ProjectDocument): Promise<void> {
    if (!projectId) return;
    setActionError(null);
    try {
      const result = await documentsApi.getDownloadUrl(projectId, document.id);
      window.open(result.url, '_blank', 'noopener,noreferrer');
    } catch (requestError) {
      setActionError(
        requestError instanceof ApiError
          ? requestError.message
          : 'Unable to create download link',
      );
    }
  }

  async function handleDelete(document: documentsApi.ProjectDocument): Promise<void> {
    if (!projectId) return;
    const confirmed = window.confirm(`Delete ${document.originalName}?`);
    if (!confirmed) return;
    setActionError(null);
    try {
      await documentsApi.deleteDocument(projectId, document.id);
      await reload({ search, category, status });
    } catch (requestError) {
      setActionError(
        requestError instanceof ApiError ? requestError.message : 'Unable to delete document',
      );
    }
  }

  const headerActions = (
    <div className="flex items-center gap-2">
      <select
        className="h-9 min-w-44 rounded-lg border border-[var(--color-input)] bg-[var(--color-input-bg)] px-3 text-sm text-[var(--color-text-primary)] outline-none transition-colors focus:border-[var(--color-ring)] focus:ring-2 focus:ring-[var(--color-focus-ring)]"
        value={projectId ?? ''}
        onChange={(event) => setProjectId(event.target.value || null)}
      >
        {projects.length === 0 ? <option value="">No projects</option> : null}
        {projects.map((project) => (
          <option key={project.id} value={project.id}>
            {project.name}
          </option>
        ))}
      </select>
      <button
        type="button"
        className="inline-flex h-9 items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface-hover)]"
        onClick={() => void reload({ search, category, status })}
      >
        <RefreshCw className="h-4 w-4" />
        Refresh
      </button>
      <button
        type="button"
        className="inline-flex h-9 items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface-hover)]"
        onClick={() => setCreateProjectOpen(true)}
      >
        <FolderPlus className="h-4 w-4" />
        New project
      </button>
      <button
        type="button"
        className="inline-flex h-9 items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
        onClick={() => setUploadOpen(true)}
        disabled={!projectId}
      >
        <Plus className="h-4 w-4" />
        Upload
      </button>
    </div>
  );

  return (
    <AppShell
      title="Documents"
      subtitle={
        selectedProject
          ? `${selectedProject.name} (${selectedProject.code})`
          : 'Project document library'
      }
      headerActions={headerActions}
    >
      <div className="mx-auto grid max-w-7xl gap-5 px-6 py-6 lg:grid-cols-[1fr_320px]">
        <section className="space-y-4">
          <DocumentFilterBar
            search={search}
            category={category}
            status={status}
            onSearchChange={setSearch}
            onCategoryChange={setCategory}
            onStatusChange={setStatus}
          />

          {projectError || actionError || error ? (
            <div className="rounded-lg border border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] px-4 py-3 text-sm text-[var(--color-danger-text)]">
              {projectError ?? actionError ?? error}
            </div>
          ) : null}

          {loading ? (
            <div className="flex min-h-64 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text-secondary)]">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading documents
            </div>
          ) : (
            <DocumentList
              documents={documents}
              selectedDocumentId={selectedDocument?.id}
              onSelect={setSelectedDocument}
              onDownload={(document) => void handleDownload(document)}
              onDelete={(document) => void handleDelete(document)}
            />
          )}

          <div className="text-sm text-[var(--color-text-secondary)]">
            Showing {documents.length} of {pagination.total} documents
          </div>
        </section>

        <DocumentPreview document={selectedDocument} />
      </div>

      <DocumentUploadModal
        open={uploadOpen}
        progress={uploadProgress}
        uploading={uploading}
        onClose={() => {
          if (!uploading) setUploadOpen(false);
        }}
        onUpload={handleUpload}
      />
      <CreateProjectModal
        open={createProjectOpen}
        creating={creatingProject}
        onClose={() => {
          if (!creatingProject) setCreateProjectOpen(false);
        }}
        onCreate={handleCreateProject}
      />
    </AppShell>
  );
}

export default function DocumentsPage() {
  return (
    <ProtectedRoute>
      <DocumentsPageContent />
    </ProtectedRoute>
  );
}
