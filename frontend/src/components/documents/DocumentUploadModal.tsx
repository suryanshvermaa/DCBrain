'use client';

import { useState } from 'react';
import { Loader2, Upload, X } from 'lucide-react';
import { FileUpload } from '@/components/common/FileUpload';

interface DocumentUploadModalProps {
  open: boolean;
  progress: number;
  uploading: boolean;
  onClose: () => void;
  onUpload: (files: File[], category: string) => Promise<void>;
}

const ACCEPTED_FILES = '.pdf,.docx,.xlsx,.csv,.json,.xml,.png,.jpg,.jpeg,.tif,.tiff';

export function DocumentUploadModal({ open, progress, uploading, onClose, onUpload }: DocumentUploadModalProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [category, setCategory] = useState('uncategorized');

  if (!open) {
    return null;
  }

  async function submit(): Promise<void> {
    await onUpload(files, category);
    setFiles([]);
    setCategory('uncategorized');
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/50 px-4">
      <div className="w-full max-w-2xl rounded-lg bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Upload documents</h2>
            <p className="text-sm text-gray-500">Batch upload up to 50 files.</p>
          </div>
          <button type="button" className="rounded-md p-2 text-gray-500 hover:bg-gray-100" onClick={onClose} disabled={uploading} aria-label="Close upload dialog">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-5">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Category</span>
            <input
              className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none ring-primary-200 focus:border-primary-500 focus:ring-2"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              disabled={uploading}
            />
          </label>

          <FileUpload accept={ACCEPTED_FILES} maxSizeMb={100} files={files} onFiles={setFiles} disabled={uploading} />

          {uploading ? (
            <div>
              <div className="mb-1 flex justify-between text-xs font-medium text-gray-600">
                <span>Uploading</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                <div className="h-full bg-primary-600 transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-200 px-5 py-4">
          <button type="button" className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50" onClick={onClose} disabled={uploading}>
            Cancel
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={() => void submit()}
            disabled={uploading || files.length === 0}
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Upload
          </button>
        </div>
      </div>
    </div>
  );
}
