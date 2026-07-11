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
    <div className="search-input-wrapper">
      {/* ── Main search bar ── */}
      <div className="search-bar">
        <span className="search-icon" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </span>

        <input
          id="search-query-input"
          type="text"
          className="search-query"
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
            className="search-clear"
            onClick={() => onQueryChange('')}
            aria-label="Clear query"
            type="button"
          >
            ✕
          </button>
        )}

        <button
          id="search-filter-toggle"
          className={`search-filter-toggle ${showFilters ? 'active' : ''}`}
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
          className="search-submit"
          onClick={onSearch}
          disabled={isSearching || !query.trim()}
          type="button"
        >
          {isSearching ? (
            <span className="search-spinner" />
          ) : (
            'Search'
          )}
        </button>
      </div>

      {/* ── Filter panel ── */}
      {showFilters && (
        <div className="search-filters-panel" id="search-filters-panel">
          <div className="filter-row">
            <label className="filter-label" htmlFor="filter-category">Category</label>
            <input
              id="filter-category"
              type="text"
              className="filter-input"
              placeholder="e.g. design, compliance"
              value={filters.category ?? ''}
              onChange={(e) =>
                onFiltersChange({ ...filters, category: e.target.value || undefined })
              }
            />
          </div>

          <div className="filter-row">
            <label className="filter-label" htmlFor="filter-date-from">Uploaded after</label>
            <input
              id="filter-date-from"
              type="date"
              className="filter-input"
              value={filters.dateFrom ? filters.dateFrom.split('T')[0] : ''}
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  dateFrom: e.target.value ? `${e.target.value}T00:00:00Z` : undefined,
                })
              }
            />
          </div>

          <div className="filter-row">
            <label className="filter-label" htmlFor="filter-date-to">Uploaded before</label>
            <input
              id="filter-date-to"
              type="date"
              className="filter-input"
              value={filters.dateTo ? filters.dateTo.split('T')[0] : ''}
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  dateTo: e.target.value ? `${e.target.value}T23:59:59Z` : undefined,
                })
              }
            />
          </div>

          <div className="filter-row">
            <label className="filter-label" htmlFor="filter-topk">Results (top K)</label>
            <select
              id="filter-topk"
              className="filter-input"
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
            className="filter-clear-btn"
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
