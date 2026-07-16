import { Download, FileText, Trash2 } from 'lucide-react';
import type { ProjectDocument } from '@/lib/api/documents';
import { ProcessingStatusBadge } from './ProcessingStatusBadge';

interface DocumentListProps {
  documents: ProjectDocument[];
  selectedDocumentId?: string;
  onSelect: (document: ProjectDocument) => void;
  onDownload: (document: ProjectDocument) => void;
  onDelete: (document: ProjectDocument) => void;
}

function formatSize(size: number): string {
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

export function DocumentList({ documents, selectedDocumentId, onSelect, onDownload, onDelete }: DocumentListProps) {
  if (documents.length === 0) {
    return (
      <div className="flex min-h-64 flex-col items-center justify-center card-level-1 transition-theme px-6 text-center">
        <FileText className="mb-3 h-9 w-9 text-[var(--color-text-tertiary)]" />
        <p className="text-sm font-semibold text-[var(--color-text-primary)]">No documents found</p>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Upload project files to start the document pipeline.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden card-level-1 transition-theme">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[var(--color-divider)] text-sm">
          <thead className="bg-[var(--color-surface-raised)] text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
            <tr>
              <th className="px-4 py-3">Document</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Size</th>
              <th className="px-4 py-3">Uploaded</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-divider)]">
            {documents.map((document) => (
              <tr
                key={document.id}
                className={`cursor-pointer transition-colors hover:bg-[var(--color-surface-hover)] ${selectedDocumentId === document.id ? 'bg-[var(--color-surface-hover)]' : ''}`}
                onClick={() => onSelect(document)}
              >
                <td className="max-w-xs px-4 py-3">
                  <p className="truncate font-medium text-[var(--color-text-primary)]">{document.originalName}</p>
                  <p className="truncate text-xs text-[var(--color-text-secondary)]">{document.mimeType}</p>
                </td>
                <td className="px-4 py-3 text-[var(--color-text-secondary)]">{document.category}</td>
                <td className="px-4 py-3">
                  <ProcessingStatusBadge status={document.status} />
                </td>
                <td className="px-4 py-3 text-[var(--color-text-secondary)]">{formatSize(document.size)}</td>
                <td className="px-4 py-3 text-[var(--color-text-secondary)]">{new Date(document.uploadedAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <button
                      type="button"
                      className="rounded-md p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
                      aria-label={`Download ${document.originalName}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        onDownload(document);
                      }}
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="rounded-md p-2 text-[var(--color-danger-text)] hover:bg-[var(--color-danger-bg)]"
                      aria-label={`Delete ${document.originalName}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        onDelete(document);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
