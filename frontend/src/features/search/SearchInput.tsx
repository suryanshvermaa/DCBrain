'use client';

import { useState, type KeyboardEvent } from 'react';
import type { SearchFilters } from '@/lib/api/search';

interface SearchInputProps {
  query: string;
  filters: SearchFilters;
  isSearching: boolean;
  onQueryChange: (q: string) => void;
  onFiltersChange: (f: SearchFilters) => void;
  onSearch: () => void;
}

export function SearchInput({
  query,
  filters,
  isSearching,
  onQueryChange,
  onFiltersChange,
  onSearch,
}: SearchInputProps) {
  const [showFilters, setShowFilters] = useState(false);

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSearch();
    }
  }

  return (
    <div className="relative card-level-1 overflow-hidden transition-theme p-4 flex flex-col gap-4 rounded-xl">
      {/* ── Main search bar ── */}
      <div className="flex items-center gap-3 w-full">
        <span className="text-[var(--color-primary)] flex items-center p-2" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </span>

        <input
          id="search-query-input"
          type="text"
          className="flex-1 border-none outline-none text-lg py-2 bg-transparent text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)]"
          placeholder="Ask anything about your project documents…"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isSearching}
          autoComplete="off"
          spellCheck={false}
        />

        {query && (
          <button
            id="search-clear-btn"
            className="bg-[var(--color-surface-hover)] rounded-full w-6 h-6 flex items-center justify-center text-[var(--color-text-secondary)] hover:bg-[var(--color-border)] hover:text-[var(--color-text-primary)] transition-colors text-xs"
            onClick={() => onQueryChange('')}
            aria-label="Clear query"
            type="button"
          >
            ✕
          </button>
        )}

        <button
          id="search-filter-toggle"
          className={`flex items-center justify-center w-10 h-10 rounded-lg border transition-colors ${showFilters ? 'bg-[var(--color-primary-100)] border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:border-[var(--color-input)]'}`}
          onClick={() => setShowFilters((v) => !v)}
          aria-label="Toggle filters"
          type="button"
          title="Filters"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="8" y1="12" x2="16" y2="12" />
            <line x1="11" y1="18" x2="13" y2="18" />
          </svg>
        </button>

        <button
          id="search-submit-btn"
          className="bg-[var(--color-primary)] text-white font-semibold py-2 px-6 rounded-lg transition-all hover:-translate-y-px hover:shadow-[0_4px_12px_var(--color-primary-100)] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none min-w-[100px] flex justify-center items-center"
          onClick={onSearch}
          disabled={isSearching || !query.trim()}
          type="button"
        >
          {isSearching ? (
            <span className="w-5 h-5 border-2 border-white/30 border-t-white border-r-transparent rounded-full animate-spin" />
          ) : (
            'Search'
          )}
        </button>
      </div>

      {/* ── Filter panel ── */}
      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-6 bg-[var(--color-surface-raised)] border-t border-[var(--color-divider)] -mx-4 -mb-4 rounded-b-xl" id="search-filters-panel">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-secondary)]" htmlFor="filter-category">Category</label>
            <input
              id="filter-category"
              type="text"
              className="px-4 py-2 border border-[var(--color-input)] rounded-lg bg-[var(--color-input-bg)] text-[var(--color-text-primary)] text-sm outline-none transition-colors focus:border-[var(--color-ring)] focus:ring-[var(--color-focus-ring)]"
              placeholder="e.g. design, compliance"
              value={filters.category ?? ''}
              onChange={(e) =>
                onFiltersChange({ ...filters, category: e.target.value || undefined })
              }
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-secondary)]" htmlFor="filter-date-from">Uploaded after</label>
            <input
              id="filter-date-from"
              type="date"
              className="px-4 py-2 border border-[var(--color-input)] rounded-lg bg-[var(--color-input-bg)] text-[var(--color-text-primary)] text-sm outline-none transition-colors focus:border-[var(--color-ring)] focus:ring-[var(--color-focus-ring)]"
              value={filters.dateFrom ? filters.dateFrom.split('T')[0] : ''}
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  dateFrom: e.target.value ? `${e.target.value}T00:00:00Z` : undefined,
                })
              }
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-secondary)]" htmlFor="filter-date-to">Uploaded before</label>
            <input
              id="filter-date-to"
              type="date"
              className="px-4 py-2 border border-[var(--color-input)] rounded-lg bg-[var(--color-input-bg)] text-[var(--color-text-primary)] text-sm outline-none transition-colors focus:border-[var(--color-ring)] focus:ring-[var(--color-focus-ring)]"
              value={filters.dateTo ? filters.dateTo.split('T')[0] : ''}
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  dateTo: e.target.value ? `${e.target.value}T23:59:59Z` : undefined,
                })
              }
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-secondary)]" htmlFor="filter-topk">Results (top K)</label>
            <select
              id="filter-topk"
              className="px-4 py-2 border border-[var(--color-input)] rounded-lg bg-[var(--color-input-bg)] text-[var(--color-text-primary)] text-sm outline-none transition-colors focus:border-[var(--color-ring)] focus:ring-[var(--color-focus-ring)]"
              value={filters.topK ?? 10}
              onChange={(e) =>
                onFiltersChange({ ...filters, topK: parseInt(e.target.value, 10) })
              }
            >
              {[5, 10, 20, 30, 50].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

          <button
            id="filter-clear-btn"
            className="col-span-full justify-self-start text-[var(--color-danger)] text-sm font-medium hover:underline underline-offset-2"
            type="button"
            onClick={() => onFiltersChange({ topK: 10 })}
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
