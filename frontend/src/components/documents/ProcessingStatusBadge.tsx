import type { ProjectDocument } from '@/lib/api/documents';

const STATUS_STYLES: Record<ProjectDocument['status'], string> = {
  QUEUED: 'bg-sky-50 text-sky-700 ring-sky-200',
  UPLOADED: 'bg-[var(--color-primary-100)] text-[var(--color-primary)] ring-blue-200',
  PROCESSING: 'bg-amber-50 text-amber-700 ring-amber-200',
  PROCESSED: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  FAILED: 'bg-red-50 text-red-700 ring-red-200',
  ARCHIVED: 'bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] ring-gray-200',
};

export function ProcessingStatusBadge({ status }: { status: ProjectDocument['status'] }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ring-1 ring-inset ${STATUS_STYLES[status]}`}>
      {status.toLowerCase().replace('_', ' ')}
    </span>
  );
}
