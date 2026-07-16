'use client';

import type { SourceCitation } from '@/lib/api/search';

interface SourceCitationCardProps {
  citation: SourceCitation;
  index: number;
  projectId: string;
}

function scoreColor(score: number): string {
  if (score >= 0.015) return 'score-high';
  if (score >= 0.008) return 'score-medium';
  return 'score-low';
}

export function SourceCitationCard({ citation, index, projectId }: SourceCitationCardProps) {
  const scoreClass = scoreColor(citation.relevanceScore);

  return (
    <div className="bg-[var(--color-surface-raised)] border border-[var(--color-divider)] rounded-xl p-5 transition-all hover:bg-[var(--color-surface)] hover:border-[var(--color-border)] hover:shadow-sm" id={`citation-card-${index}`}>
      <div className="flex items-center gap-4 mb-3">
        <span className="bg-[var(--color-divider)] text-[var(--color-text-secondary)] w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold">{index + 1}</span>
        <div className="flex-1 flex flex-col">
          <span className="font-semibold text-[var(--color-text-primary)] text-[15px]" title={citation.documentName}>
            {citation.documentName}
          </span>
          <span className="text-xs text-[var(--color-text-secondary)]">
            Page {citation.pageNumber} · Chunk {citation.chunkIndex}
          </span>
        </div>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${scoreClass === 'score-high' ? 'bg-[var(--color-success-bg)] text-[var(--color-success-text)]' : scoreClass === 'score-medium' ? 'bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]' : 'bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]'}`} title="Relevance score">
          {(citation.relevanceScore * 1000).toFixed(1)}
        </span>
      </div>

      <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-4 bg-[var(--color-surface)] p-4 rounded-lg">{citation.excerpt}</p>

      <a
        id={`citation-download-${citation.documentId}`}
        className="text-sm font-semibold text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] transition-colors inline-block"
        href={`/api/v1/projects/${projectId}/documents/${citation.documentId}/download-url`}
        target="_blank"
        rel="noopener noreferrer"
      >
        View document ↗
      </a>
    </div>
  );
}
