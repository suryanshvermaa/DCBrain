import { Search } from 'lucide-react';

interface DocumentFilterBarProps {
  search: string;
  category: string;
  status: string;
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onStatusChange: (value: string) => void;
}

export function DocumentFilterBar({ search, category, status, onSearchChange, onCategoryChange, onStatusChange }: DocumentFilterBarProps) {
  return (
    <div className="grid gap-3 md:grid-cols-[1fr_180px_180px]">
      <label className="relative block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          className="h-10 w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 text-sm outline-none ring-primary-200 focus:border-primary-500 focus:ring-2"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search documents"
        />
      </label>
      <input
        className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none ring-primary-200 focus:border-primary-500 focus:ring-2"
        value={category}
        onChange={(event) => onCategoryChange(event.target.value)}
        placeholder="Category"
      />
      <select
        className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none ring-primary-200 focus:border-primary-500 focus:ring-2"
        value={status}
        onChange={(event) => onStatusChange(event.target.value)}
      >
        <option value="">All statuses</option>
        <option value="QUEUED">Queued</option>
        <option value="PROCESSING">Processing</option>
        <option value="PROCESSED">Processed</option>
        <option value="FAILED">Failed</option>
        <option value="ARCHIVED">Archived</option>
      </select>
    </div>
  );
}
