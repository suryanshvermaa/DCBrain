import { FileText } from 'lucide-react';
import type { ProjectDocument } from '@/lib/api/documents';
import { ProcessingStatusBadge } from './ProcessingStatusBadge';

export function DocumentPreview({ document }: { document: ProjectDocument | null }) {
  if (!document) {
    return (
      <aside className="card-level-1 transition-theme p-5">
        <FileText className="mb-3 h-8 w-8 text-[var(--color-text-tertiary)]" />
        <p className="text-sm font-semibold text-[var(--color-text-primary)]">Select a document</p>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Metadata and version details appear here.</p>
      </aside>
    );
  }

  return (
    <aside className="card-level-1 transition-theme p-5">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-[var(--color-text-primary)]">{document.originalName}</p>
          <p className="mt-1 text-xs text-[var(--color-text-secondary)]">{document.mimeType}</p>
        </div>
        <ProcessingStatusBadge status={document.status} />
      </div>

      <dl className="space-y-3 text-sm">
        <div>
          <dt className="text-xs font-semibold uppercase text-[var(--color-text-secondary)]">Category</dt>
          <dd className="mt-1 text-[var(--color-text-primary)]">{document.category}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase text-[var(--color-text-secondary)]">Owner</dt>
          <dd className="mt-1 text-[var(--color-text-primary)]">{document.owner.firstName} {document.owner.lastName}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase text-[var(--color-text-secondary)]">Uploaded</dt>
          <dd className="mt-1 text-[var(--color-text-primary)]">{new Date(document.uploadedAt).toLocaleString()}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase text-[var(--color-text-secondary)]">Versions</dt>
          <dd className="mt-2 space-y-2">
            {document.versions.map((version) => (
              <div key={version.id} className="rounded-md border border-[var(--color-border)] px-3 py-2">
                <p className="font-medium text-[var(--color-text-primary)]">Version {version.version}</p>
                <p className="text-xs text-[var(--color-text-secondary)]">{new Date(version.createdAt).toLocaleString()}</p>
              </div>
            ))}
          </dd>
        </div>
      </dl>
    </aside>
  );
}
