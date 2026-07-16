'use client';

import { useState } from 'react';
import type { SearchHistoryItem } from '@/lib/api/search';

interface SearchHistorySidebarProps {
  history: SearchHistoryItem[];
  onRerun: (query: string) => void;
  onLoadMore: () => void;
}

export function SearchHistorySidebar({
  history,
  onRerun,
  onLoadMore,
}: SearchHistorySidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  function formatTime(iso: string): string {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60_000);
    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH}h ago`;
    return d.toLocaleDateString();
  }

  return (
    <aside className={`card-level-1 transition-theme p-6 rounded-2xl sticky top-8 overflow-hidden transition-all duration-300 ${collapsed ? 'w-16 px-4' : 'w-72'}`} id="search-history-sidebar">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-base font-semibold text-[var(--color-text-primary)] whitespace-nowrap">
          {!collapsed && '🕐 Recent Searches'}
        </h3>
        <button
          id="history-collapse-btn"
          className="w-7 h-7 rounded-full flex items-center justify-center bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)] hover:text-[var(--color-text-primary)] transition-all flex-shrink-0"
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? 'Expand history' : 'Collapse history'}
        >
          {collapsed ? '›' : '‹'}
        </button>
      </div>

      {!collapsed && (
        <>
          {history.length === 0 && (
            <p className="text-sm text-[var(--color-text-secondary)]">No searches yet. Run your first query!</p>
          )}

          <ul className="flex flex-col gap-2" id="history-list">
            {history.map((item) => (
              <li key={item.id} className="">
                <button
                  id={`history-item-${item.id}`}
                  className="w-full text-left bg-transparent border border-transparent p-3 rounded-xl cursor-pointer transition-all flex flex-col gap-1 hover:bg-[var(--color-surface-raised)] hover:border-[var(--color-border)] hover:translate-x-1"
                  type="button"
                  onClick={() => onRerun(item.query)}
                  title={item.query}
                >
                  <span className="font-medium text-[var(--color-text-primary)] text-sm whitespace-nowrap overflow-hidden text-ellipsis block">{item.query}</span>
                  <div className="flex justify-between text-xs text-[var(--color-text-tertiary)]">
                    <span className="">
                      {item.resultCount} result{item.resultCount !== 1 ? 's' : ''}
                    </span>
                    <span className="">{formatTime(item.createdAt)}</span>
                  </div>
                </button>
              </li>
            ))}
          </ul>

          {history.length >= 20 && (
            <button
              id="history-load-more-btn"
              className="w-full p-3 mt-4 bg-[var(--color-surface-hover)] border border-dashed border-[var(--color-border)] rounded-lg text-[var(--color-text-secondary)] font-medium transition-all hover:bg-[var(--color-surface-raised)] hover:border-solid hover:border-[var(--color-input)]"
              type="button"
              onClick={onLoadMore}
            >
              Load more
            </button>
          )}
        </>
      )}
    </aside>
  );
}
