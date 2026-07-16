'use client';

import { useState } from 'react';
import type { SearchResponse } from '@/lib/api/search';
import { SourceCitationCard } from './SourceCitationCard';

interface AIAnswerCardProps {
  result: SearchResponse;
  projectId: string;
}

function confidenceLabel(score: number): { label: string; cls: string } {
  if (score >= 0.75) return { label: 'High confidence', cls: 'conf-high' };
  if (score >= 0.45) return { label: 'Medium confidence', cls: 'conf-medium' };
  return { label: 'Low confidence', cls: 'conf-low' };
}

export function AIAnswerCard({ result, projectId }: AIAnswerCardProps) {
  const [showSources, setShowSources] = useState(true);
  const conf = confidenceLabel(result.confidence);

  return (
    <div className="card-level-1 relative overflow-hidden transition-theme p-8 rounded-2xl before:absolute before:top-0 before:left-0 before:w-full before:h-1 before:bg-gradient-to-r before:from-[var(--color-primary)] before:to-[var(--color-secondary)]" id="ai-answer-card">
      {/* ── Header ── */}
      <div className="flex justify-between items-center mb-6 pb-6 border-b border-[var(--color-divider)]">
        <div className="flex items-center gap-4">
          <span className="text-2xl bg-[var(--color-primary-100)] p-2 rounded-xl" aria-hidden="true">🧠</span>
          <h2 className="text-xl font-bold text-[var(--color-text-primary)]">AI Answer</h2>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wide border ${conf.cls === 'conf-high' ? 'bg-[var(--color-success-bg)] text-[var(--color-success-text)] border-[var(--color-success-border)]' : conf.cls === 'conf-medium' ? 'bg-[var(--color-warning-bg)] text-[var(--color-warning-text)] border-[var(--color-warning-border)]' : 'bg-[var(--color-danger-bg)] text-[var(--color-danger-text)] border-[var(--color-danger-border)]'}`}>{conf.label}</span>
          {result.cached && (
            <span className="text-xs font-semibold bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] px-3 py-1 rounded-full border border-[var(--color-border)]" title="Served from cache">⚡ Cached</span>
          )}
        </div>
        <span className="text-sm text-[var(--color-text-tertiary)] font-mono">{result.processingMs}ms</span>
      </div>

      {/* ── Answer text ── */}
      <div className="text-lg leading-relaxed text-[var(--color-text-primary)] mb-8 space-y-4" id="ai-answer-text">
        {result.answer.split('\n').map((line, i) => (
          <p key={i} className="">
            {line}
          </p>
        ))}
      </div>

      {/* ── Confidence bar ── */}
      <div className="flex items-center gap-4 bg-[var(--color-surface-raised)] p-4 rounded-xl mb-8">
        <span className="text-sm font-semibold text-[var(--color-text-secondary)]">Confidence</span>
        <div className="flex-1 h-2 bg-[var(--color-divider)] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${conf.cls === 'conf-high' ? 'bg-[var(--color-success)]' : conf.cls === 'conf-medium' ? 'bg-[var(--color-warning)]' : 'bg-[var(--color-danger)]'}`}
            style={{ width: `${Math.round(result.confidence * 100)}%` }}
          />
        </div>
        <span className="text-sm font-bold text-[var(--color-text-primary)]">{Math.round(result.confidence * 100)}%</span>
      </div>

      {/* ── Sources toggle ── */}
      {result.sources.length > 0 && (
        <div className="border-t border-[var(--color-divider)] pt-6">
          <button
            id="sources-toggle-btn"
            className="flex items-center gap-2 text-sm font-semibold text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] transition-colors"
            type="button"
            onClick={() => setShowSources((v) => !v)}
          >
            <span>📄 {result.sources.length} source{result.sources.length !== 1 ? 's' : ''}</span>
            <span className="text-xs">{showSources ? '▲' : '▼'}</span>
          </button>

          {showSources && (
            <div className="flex flex-col gap-4 mt-6" id="sources-list">
              {result.sources.map((citation, index) => (
                <SourceCitationCard
                  key={`${citation.documentId}-${citation.chunkIndex}`}
                  citation={citation}
                  index={index}
                  projectId={projectId}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {result.sources.length === 0 && (
        <p className="text-[var(--color-text-secondary)] text-sm">No source documents were retrieved for this answer.</p>
      )}
    </div>
  );
}
