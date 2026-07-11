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
    <aside className={`search-history-sidebar ${collapsed ? 'collapsed' : ''}`} id="search-history-sidebar">
      <div className="history-sidebar-header">
        <h3 className="history-sidebar-title">
          {!collapsed && '🕐 Recent Searches'}
        </h3>
        <button
          id="history-collapse-btn"
          className="history-collapse-btn"
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
            <p className="history-empty">No searches yet. Run your first query!</p>
          )}

          <ul className="history-list" id="history-list">
            {history.map((item) => (
              <li key={item.id} className="history-item">
                <button
                  id={`history-item-${item.id}`}
                  className="history-item-btn"
                  type="button"
                  onClick={() => onRerun(item.query)}
                  title={item.query}
                >
                  <span className="history-item-query">{item.query}</span>
                  <div className="history-item-meta">
                    <span className="history-item-count">
                      {item.resultCount} result{item.resultCount !== 1 ? 's' : ''}
                    </span>
                    <span className="history-item-time">{formatTime(item.createdAt)}</span>
                  </div>
                </button>
              </li>
            ))}
          </ul>

          {history.length >= 20 && (
            <button
              id="history-load-more-btn"
              className="history-load-more"
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
