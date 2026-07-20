'use client';

import { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
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
    deleteHistoryItem,
  } = useSearch(projectId ?? '');

  const headerActions = (
    <div className="flex items-center gap-3">
      {projects.length > 0 && (
        <select
          value={projectId ?? ''}
          onChange={(e) => setProjectId(e.target.value)}
          className="h-9 min-w-44 rounded-lg border border-[var(--color-input)] bg-[var(--color-input-bg)] px-3 text-sm text-[var(--color-text-primary)] outline-none transition-colors focus:border-[var(--color-ring)] focus:ring-2 focus:ring-[var(--color-focus-ring)]"
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      )}
    </div>
  );

  return (
    <AppShell
      title="Document Intelligence Search"
      subtitle="Hybrid semantic + keyword search across all project documents, powered by AI"
      headerActions={headerActions}
    >
      <div className="flex flex-1 max-w-7xl mx-auto w-full p-8 gap-10 items-start">
        {projectError && (
          <div className="bg-[var(--color-danger-bg)] border border-[var(--color-danger-border)] text-[var(--color-danger-text)] px-4 py-3 rounded-lg w-full" role="alert">
            {projectError}
          </div>
        )}
        
        {!projectId && !projectError && (
          <div className="flex flex-col items-center justify-center p-20 text-center card-level-1 transition-theme w-full">
            <span className="text-5xl mb-4 opacity-50">📁</span>
            <p className="text-[var(--color-text-secondary)]">No projects found. Create a project and upload documents first.</p>
          </div>
        )}

        {projectId && (
          <>
            <div className="w-72 flex-shrink-0 sticky top-8">
              <SearchHistorySidebar
                history={history}
                onRerun={rerunQuery}
                onLoadMore={loadMoreHistory}
                onDelete={deleteHistoryItem}
              />
            </div>

            <main className="flex-1 flex flex-col gap-8 max-w-4xl mx-auto w-full">
              <SearchInput
                query={query}
                filters={filters}
                isSearching={isSearching}
                onQueryChange={setQuery}
                onFiltersChange={setFilters}
                onSearch={runSearch}
              />

              {isSearching && (
                <div className="card-level-1 flex flex-col items-center justify-center p-16 text-center gap-6 transition-theme">
                  <div className="w-10 h-10 border-4 border-[var(--color-divider)] border-t-[var(--color-primary)] border-r-transparent rounded-full animate-spin" />
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold text-lg text-[var(--color-text-primary)]">Running hybrid search…</span>
                    <span className="text-sm text-[var(--color-text-secondary)] animate-pulse">Embedding query · Vector search · Keyword search · AI generation</span>
                  </div>
                </div>
              )}

              {!isSearching && error && (
                <div className="bg-[var(--color-danger-bg)] border border-[var(--color-danger-border)] text-[var(--color-danger-text)] px-6 py-4 rounded-xl flex items-center gap-4 font-medium" role="alert">
                  <span>⚠</span>
                  <span>{error}</span>
                </div>
              )}

              {!isSearching && !error && result && (
                <div className="space-y-4">
                  <div className="text-[var(--color-text-secondary)] text-sm">
                    <span>
                      {result.resultCount} chunk{result.resultCount !== 1 ? 's' : ''} retrieved for
                      &ldquo;<strong className="text-[var(--color-text-primary)]">{result.query}</strong>&rdquo;
                    </span>
                  </div>
                  <AIAnswerCard result={result} projectId={projectId} />
                </div>
              )}

              {!isSearching && !error && !result && (
                <div className="card-level-1 flex flex-col items-center justify-center p-20 text-center transition-theme">
                  <div className="text-5xl mb-4 flex items-center justify-center w-20 h-20 bg-[var(--color-info-bg)] rounded-full shadow-[0_0_0_10px_var(--color-surface)]">💡</div>
                  <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">Ask your documents anything</h2>
                  <p className="text-[var(--color-text-secondary)] max-w-lg leading-relaxed mb-8">
                    DCBrain combines semantic vector search with keyword matching and generates
                    AI-powered answers grounded in your project documents.
                  </p>
                  <div className="flex flex-wrap gap-3 justify-center max-w-2xl">
                    {[
                      'What are the cooling redundancy requirements?',
                      'Summarise NFPA 75 compliance obligations',
                      'List all UPS specifications in the design documents',
                      'What is the planned server room power density?',
                    ].map((q) => (
                      <button
                        key={q}
                        className="bg-[var(--color-surface)] border border-[var(--color-border)] py-3 px-5 rounded-full text-sm text-[var(--color-primary)] font-medium transition-all hover:bg-[var(--color-surface-hover)] hover:border-[var(--color-primary)] hover:-translate-y-0.5 shadow-sm"
                        type="button"
                        onClick={() => {
                          setQuery(q);
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
          </>
        )}
      </div>
    </AppShell>
  );
}

export default function SearchPage() {
  return (
    <ProtectedRoute>
      <SearchPageContent />
    </ProtectedRoute>
  );
}
