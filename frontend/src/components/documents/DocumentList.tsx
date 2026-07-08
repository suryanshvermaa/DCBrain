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
      <div className="flex min-h-64 flex-col items-center justify-center rounded-lg border border-gray-200 bg-white px-6 text-center">
        <FileText className="mb-3 h-9 w-9 text-gray-400" />
        <p className="text-sm font-semibold text-gray-900">No documents found</p>
        <p className="mt-1 text-sm text-gray-500">Upload project files to start the document pipeline.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Document</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Size</th>
              <th className="px-4 py-3">Uploaded</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {documents.map((document) => (
              <tr
                key={document.id}
                className={`cursor-pointer hover:bg-gray-50 ${selectedDocumentId === document.id ? 'bg-primary-50' : ''}`}
                onClick={() => onSelect(document)}
              >
                <td className="max-w-xs px-4 py-3">
                  <p className="truncate font-medium text-gray-900">{document.originalName}</p>
                  <p className="truncate text-xs text-gray-500">{document.mimeType}</p>
                </td>
                <td className="px-4 py-3 text-gray-700">{document.category}</td>
                <td className="px-4 py-3">
                  <ProcessingStatusBadge status={document.status} />
                </td>
                <td className="px-4 py-3 text-gray-700">{formatSize(document.size)}</td>
                <td className="px-4 py-3 text-gray-700">{new Date(document.uploadedAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <button
                      type="button"
                      className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
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
                      className="rounded-md p-2 text-red-500 hover:bg-red-50 hover:text-red-700"
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
