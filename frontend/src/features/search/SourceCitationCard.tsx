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
    <div className="citation-card" id={`citation-card-${index}`}>
      <div className="citation-header">
        <span className="citation-index">{index + 1}</span>
        <div className="citation-meta">
          <span className="citation-doc-name" title={citation.documentName}>
            {citation.documentName}
          </span>
          <span className="citation-detail">
            Page {citation.pageNumber} · Chunk {citation.chunkIndex}
          </span>
        </div>
        <span className={`citation-score ${scoreClass}`} title="Relevance score">
          {(citation.relevanceScore * 1000).toFixed(1)}
        </span>
      </div>

      <p className="citation-excerpt">{citation.excerpt}</p>

      <a
        id={`citation-download-${citation.documentId}`}
        className="citation-download-link"
        href={`/api/v1/projects/${projectId}/documents/${citation.documentId}/download-url`}
        target="_blank"
        rel="noopener noreferrer"
      >
        View document ↗
      </a>
    </div>
  );
}
