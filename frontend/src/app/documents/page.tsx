'use client';

import { useEffect, useMemo, useState } from 'react';
import { FileText, FolderPlus, Loader2, Plus, RefreshCw } from 'lucide-react';
import { CreateProjectModal } from '@/components/documents/CreateProjectModal';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DocumentFilterBar } from '@/components/documents/DocumentFilterBar';
import { DocumentList } from '@/components/documents/DocumentList';
import { DocumentPreview } from '@/components/documents/DocumentPreview';
import { DocumentUploadModal } from '@/components/documents/DocumentUploadModal';
import { useDocuments } from '@/hooks/useDocuments';
import { ApiError } from '@/lib/api';
import * as documentsApi from '@/lib/api/documents';
import * as projectsApi from '@/lib/api/projects';

export default function DocumentsPage() {
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

  const { documents, selectedDocument, setSelectedDocument, loading, error, pagination, reload } = useDocuments(projectId);

  const selectedProject = useMemo(() => projects.find((project) => project.id === projectId) ?? null, [projectId, projects]);

  useEffect(() => {
    async function loadProjects(): Promise<void> {
      try {
        const result = await projectsApi.listProjects();
        setProjects(result.projects);
        setProjectId((current) => current ?? result.projects[0]?.id ?? null);
      } catch (requestError) {
        setProjectError(requestError instanceof ApiError ? requestError.message : 'Unable to load projects');
      }
    }

    void loadProjects();
  }, []);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      void reload({
        search,
        category,
        status,
      });
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
      setActionError(requestError instanceof ApiError ? requestError.message : 'Unable to upload documents');
    } finally {
      setUploading(false);
    }
  }

  async function handleCreateProject(payload: projectsApi.CreateProjectPayload): Promise<void> {
    setCreatingProject(true);
    setActionError(null);
    try {
      const result = await projectsApi.createProject(payload);
      setProjects((current) => [result.project, ...current.filter((project) => project.id !== result.project.id)]);
      setProjectId(result.project.id);
      setCreateProjectOpen(false);
    } catch (requestError) {
      setActionError(requestError instanceof ApiError ? requestError.message : 'Unable to create project');
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
      setActionError(requestError instanceof ApiError ? requestError.message : 'Unable to create download link');
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
      setActionError(requestError instanceof ApiError ? requestError.message : 'Unable to delete document');
    }
  }

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-gray-50">
        <header className="border-b border-gray-200 bg-white">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
            <div>
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600 text-white">
                  <FileText className="h-5 w-5" />
                </span>
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900">Documents</h1>
                  <p className="text-sm text-gray-500">{selectedProject ? `${selectedProject.name} (${selectedProject.code})` : 'Project document library'}</p>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <select
                className="h-10 min-w-56 rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none ring-primary-200 focus:border-primary-500 focus:ring-2"
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
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                onClick={() => void reload({ search, category, status })}
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
              <button
                type="button"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                onClick={() => setCreateProjectOpen(true)}
              >
                <FolderPlus className="h-4 w-4" />
                New project
              </button>
              <button
                type="button"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 text-sm font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={() => setUploadOpen(true)}
                disabled={!projectId}
              >
                <Plus className="h-4 w-4" />
                Upload
              </button>
            </div>
          </div>
        </header>

        <div className="mx-auto grid max-w-7xl gap-5 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_320px] lg:px-8">
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
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{projectError ?? actionError ?? error}</div>
            ) : null}

            {loading ? (
              <div className="flex min-h-64 items-center justify-center rounded-lg border border-gray-200 bg-white text-sm text-gray-500">
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

            <div className="text-sm text-gray-500">
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
      </main>
    </ProtectedRoute>
  );
}
