'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  searchProject,
  getSearchHistory,
  deleteSearchHistoryItem,
  type SearchResponse,
  type SearchFilters,
  type SearchHistoryItem,
} from '@/lib/api/search';
import { ApiError } from '@/lib/api';

interface UseSearchState {
  query: string;
  filters: SearchFilters;
  result: SearchResponse | null;
  history: SearchHistoryItem[];
  isSearching: boolean;
  error: string | null;
}

interface UseSearchActions {
  setQuery: (q: string) => void;
  setFilters: (f: SearchFilters) => void;
  runSearch: () => Promise<void>;
  rerunQuery: (q: string) => void;
  clearResult: () => void;
  loadMoreHistory: () => void;
  deleteHistoryItem: (id: string) => Promise<void>;
}

export function useSearch(projectId: string): UseSearchState & UseSearchActions {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({ topK: 10 });
  const [result, setResult] = useState<SearchResponse | null>(null);
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial search history
  const fetchHistory = useCallback(
    async (page: number) => {
      if (!projectId) return;
      try {
        const res = await getSearchHistory(projectId, page, 20);
        if (page === 1) {
          setHistory(res.history);
        } else {
          setHistory((prev) => [...prev, ...res.history]);
        }
      } catch {
        // Non-critical — silently fail
      }
    },
    [projectId]
  );

  useEffect(() => {
    void fetchHistory(1);
  }, [fetchHistory]);

  const runSearch = useCallback(async () => {
    const trimmed = query.trim();
    if (!trimmed || !projectId) return;

    setIsSearching(true);
    setError(null);

    try {
      const res = await searchProject(projectId, { query: trimmed, filters });
      setResult(res);
      // Refresh history after a new search
      void fetchHistory(1);
      setHistoryPage(1);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Search failed. Please try again.');
      }
    } finally {
      setIsSearching(false);
    }
  }, [query, filters, projectId, fetchHistory]);

  const rerunQuery = useCallback((q: string) => {
    setQuery(q);
    // Trigger search on next render via ref trick
    pendingRerun.current = q;
  }, []);

  const pendingRerun = useRef<string | null>(null);

  useEffect(() => {
    if (pendingRerun.current) {
      const q = pendingRerun.current;
      pendingRerun.current = null;
      setQuery(q);
      setIsSearching(true);
      setError(null);
      searchProject(projectId, { query: q, filters })
        .then((res) => {
          setResult(res);
          void fetchHistory(1);
        })
        .catch((err) => {
          setError(err instanceof ApiError ? err.message : 'Search failed.');
        })
        .finally(() => setIsSearching(false));
    }
  }, [projectId, filters, fetchHistory]);

  const loadMoreHistory = useCallback(() => {
    const nextPage = historyPage + 1;
    setHistoryPage(nextPage);
    void fetchHistory(nextPage);
  }, [historyPage, fetchHistory]);

  const clearResult = useCallback(() => setResult(null), []);

  const deleteHistoryItem = useCallback(
    async (id: string) => {
      if (!projectId) return;
      try {
        await deleteSearchHistoryItem(projectId, id);
        setHistory((prev) => prev.filter((item) => item.id !== id));
      } catch (err) {
        console.error('Failed to delete search history item', err);
      }
    },
    [projectId]
  );

  return {
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
    clearResult,
    loadMoreHistory,
    deleteHistoryItem,
  };
}
