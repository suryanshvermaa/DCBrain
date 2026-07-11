'use client';

import { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { SearchInput } from '@/features/search/SearchInput';
import { AIAnswerCard } from '@/features/search/AIAnswerCard';
import { SearchHistorySidebar } from '@/features/search/SearchHistorySidebar';
import { useSearch } from '@/hooks/useSearch';
import * as projectsApi from '@/lib/api/projects';

function SearchPageContent() {
  const [projects, setProjects] = useState<projectsApi.Project[]>([]);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projectError, setProjectError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProjects(): Promise<void> {
      try {
        const result = await projectsApi.listProjects();
        setProjects(result.projects);
        setProjectId((current) => current ?? result.projects[0]?.id ?? null);
      } catch {
        setProjectError('Failed to load projects. Please refresh.');
      }
    }
    void loadProjects();
  }, []);

  const {
    query,
    filters,
    result,
    history,
    isSearching,
    error,
    setQuery,
    setFilters,
    runSearch,
    rerunQuery,
    loadMoreHistory,
  } = useSearch(projectId ?? '');

  return (
    <div className="search-page">
      {/* ── Page header ── */}
      <header className="search-page-header">
        <div className="search-page-header-inner">
          <div className="search-page-title-group">
            <h1 className="search-page-title">
              <span className="search-page-icon">🔍</span>
              Document Intelligence Search
            </h1>
            <p className="search-page-subtitle">
              Hybrid semantic + keyword search across all project documents, powered by AI
            </p>
          </div>

          {/* Project selector */}
          {projects.length > 1 && (
            <div className="search-project-selector">
              <label htmlFor="search-project-select" className="search-project-label">
                Project
              </label>
              <select
                id="search-project-select"
                className="search-project-select"
                value={projectId ?? ''}
                onChange={(e) => setProjectId(e.target.value)}
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </header>

      {/* ── Error states ── */}
      {projectError && (
        <div className="search-error-banner" role="alert">
          {projectError}
        </div>
      )}

      {!projectId && !projectError && (
        <div className="search-no-project">
          <span className="search-no-project-icon">📁</span>
          <p>No projects found. Create a project and upload documents first.</p>
        </div>
      )}

      {/* ── Main layout ── */}
      {projectId && (
        <div className="search-layout">
          {/* History sidebar */}
          <SearchHistorySidebar
            history={history}
            onRerun={rerunQuery}
            onLoadMore={loadMoreHistory}
          />

          {/* Search main area */}
          <main className="search-main" id="search-main">
            <SearchInput
              query={query}
              filters={filters}
              isSearching={isSearching}
              onQueryChange={setQuery}
              onFiltersChange={setFilters}
              onSearch={runSearch}
            />

            {/* Searching state */}
            {isSearching && (
              <div className="search-loading" id="search-loading" aria-live="polite">
                <div className="search-loading-spinner" />
                <div className="search-loading-text">
                  <span>Running hybrid search…</span>
                  <span className="search-loading-sub">Embedding query · Vector search · Keyword search · AI generation</span>
                </div>
              </div>
            )}

            {/* Error */}
            {!isSearching && error && (
              <div className="search-error" role="alert" id="search-error">
                <span className="search-error-icon">⚠</span>
                <span>{error}</span>
              </div>
            )}

            {/* Results */}
            {!isSearching && !error && result && (
              <div className="search-results" id="search-results">
                <div className="search-results-meta">
                  <span>
                    {result.resultCount} chunk{result.resultCount !== 1 ? 's' : ''} retrieved for
                    &ldquo;<strong>{result.query}</strong>&rdquo;
                  </span>
                </div>
                <AIAnswerCard result={result} projectId={projectId} />
              </div>
            )}

            {/* Empty state */}
            {!isSearching && !error && !result && (
              <div className="search-empty-state" id="search-empty-state">
                <div className="search-empty-icon">💡</div>
                <h2 className="search-empty-title">Ask your documents anything</h2>
                <p className="search-empty-sub">
                  DCBrain combines semantic vector search with keyword matching and generates
                  AI-powered answers grounded in your project documents.
                </p>
                <div className="search-example-queries">
                  {[
                    'What are the cooling redundancy requirements?',
                    'Summarise NFPA 75 compliance obligations',
                    'List all UPS specifications in the design documents',
                    'What is the planned server room power density?',
                  ].map((q) => (
                    <button
                      key={q}
                      className="search-example-chip"
                      type="button"
                      onClick={() => {
                        setQuery(q);
                        // Small delay so the query state is committed before search fires
                        setTimeout(runSearch, 50);
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </main>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <ProtectedRoute>
      <SearchPageContent />
    </ProtectedRoute>
  );
}
