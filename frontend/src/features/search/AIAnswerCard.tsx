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
    <div className="ai-answer-card" id="ai-answer-card">
      {/* ── Header ── */}
      <div className="ai-answer-header">
        <div className="ai-answer-title-row">
          <span className="ai-brain-icon" aria-hidden="true">🧠</span>
          <h2 className="ai-answer-title">AI Answer</h2>
          <span className={`confidence-badge ${conf.cls}`}>{conf.label}</span>
          {result.cached && (
            <span className="cached-badge" title="Served from cache">⚡ Cached</span>
          )}
        </div>
        <span className="ai-processing-time">{result.processingMs}ms</span>
      </div>

      {/* ── Answer text ── */}
      <div className="ai-answer-body" id="ai-answer-text">
        {result.answer.split('\n').map((line, i) => (
          <p key={i} className="ai-answer-paragraph">
            {line}
          </p>
        ))}
      </div>

      {/* ── Confidence bar ── */}
      <div className="confidence-bar-wrap">
        <span className="confidence-bar-label">Confidence</span>
        <div className="confidence-bar-track">
          <div
            className={`confidence-bar-fill ${conf.cls}`}
            style={{ width: `${Math.round(result.confidence * 100)}%` }}
          />
        </div>
        <span className="confidence-bar-pct">{Math.round(result.confidence * 100)}%</span>
      </div>

      {/* ── Sources toggle ── */}
      {result.sources.length > 0 && (
        <div className="sources-section">
          <button
            id="sources-toggle-btn"
            className="sources-toggle"
            type="button"
            onClick={() => setShowSources((v) => !v)}
          >
            <span>📄 {result.sources.length} source{result.sources.length !== 1 ? 's' : ''}</span>
            <span className="sources-chevron">{showSources ? '▲' : '▼'}</span>
          </button>

          {showSources && (
            <div className="sources-list" id="sources-list">
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
        <p className="no-sources-note">No source documents were retrieved for this answer.</p>
      )}
    </div>
  );
}
