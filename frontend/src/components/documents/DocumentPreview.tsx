import { FileText } from 'lucide-react';
import type { ProjectDocument } from '@/lib/api/documents';
import { ProcessingStatusBadge } from './ProcessingStatusBadge';

export function DocumentPreview({ document }: { document: ProjectDocument | null }) {
  if (!document) {
    return (
      <aside className="rounded-lg border border-gray-200 bg-white p-5">
        <FileText className="mb-3 h-8 w-8 text-gray-400" />
        <p className="text-sm font-semibold text-gray-900">Select a document</p>
        <p className="mt-1 text-sm text-gray-500">Metadata and version details appear here.</p>
      </aside>
    );
  }

  return (
    <aside className="rounded-lg border border-gray-200 bg-white p-5">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-gray-900">{document.originalName}</p>
          <p className="mt-1 text-xs text-gray-500">{document.mimeType}</p>
        </div>
        <ProcessingStatusBadge status={document.status} />
      </div>

      <dl className="space-y-3 text-sm">
        <div>
          <dt className="text-xs font-semibold uppercase text-gray-500">Category</dt>
          <dd className="mt-1 text-gray-900">{document.category}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase text-gray-500">Owner</dt>
          <dd className="mt-1 text-gray-900">{document.owner.firstName} {document.owner.lastName}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase text-gray-500">Uploaded</dt>
          <dd className="mt-1 text-gray-900">{new Date(document.uploadedAt).toLocaleString()}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase text-gray-500">Versions</dt>
          <dd className="mt-2 space-y-2">
            {document.versions.map((version) => (
              <div key={version.id} className="rounded-md border border-gray-200 px-3 py-2">
                <p className="font-medium text-gray-900">Version {version.version}</p>
                <p className="text-xs text-gray-500">{new Date(version.createdAt).toLocaleString()}</p>
              </div>
            ))}
          </dd>
        </div>
      </dl>
    </aside>
  );
}
