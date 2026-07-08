'use client';

import { ChangeEvent, DragEvent, useRef, useState } from 'react';
import { FileUp, X } from 'lucide-react';

interface FileUploadProps {
  accept: string;
  maxSizeMb: number;
  multiple?: boolean;
  disabled?: boolean;
  files: File[];
  onFiles: (files: File[]) => void;
}

export function FileUpload({ accept, maxSizeMb, multiple = true, disabled = false, files, onFiles }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addFiles(nextFiles: FileList | File[]): void {
    const incoming = Array.from(nextFiles);
    const maxBytes = maxSizeMb * 1024 * 1024;
    const oversized = incoming.find((file) => file.size > maxBytes);

    if (oversized) {
      setError(`${oversized.name} exceeds ${maxSizeMb}MB`);
      return;
    }

    const merged = multiple ? [...files, ...incoming].slice(0, 50) : incoming.slice(0, 1);
    setError(null);
    onFiles(merged);
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>): void {
    if (event.target.files) {
      addFiles(event.target.files);
    }
    event.target.value = '';
  }

  function handleDrop(event: DragEvent<HTMLDivElement>): void {
    event.preventDefault();
    setIsDragging(false);
    if (!disabled) {
      addFiles(event.dataTransfer.files);
    }
  }

  return (
    <div className="space-y-3">
      <div
        className={`flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed px-4 py-8 text-center transition ${
          isDragging ? 'border-primary-500 bg-primary-50' : 'border-gray-300 bg-white hover:border-primary-400'
        } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
        onClick={() => {
          if (!disabled) inputRef.current?.click();
        }}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <FileUp className="mb-3 h-8 w-8 text-primary-600" />
        <p className="text-sm font-semibold text-gray-900">Drop files here or choose files</p>
        <p className="mt-1 text-xs text-gray-500">PDF, DOCX, XLSX, CSV, JSON, XML, PNG, JPG, TIFF up to {maxSizeMb}MB</p>
        <input
          ref={inputRef}
          className="hidden"
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          onChange={handleInputChange}
        />
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {files.length > 0 ? (
        <div className="max-h-40 overflow-y-auto rounded-lg border border-gray-200 bg-white">
          {files.map((file, index) => (
            <div key={`${file.name}-${file.lastModified}-${index}`} className="flex items-center justify-between gap-3 border-b border-gray-100 px-3 py-2 last:border-b-0">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-900">{file.name}</p>
                <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <button
                type="button"
                className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                aria-label={`Remove ${file.name}`}
                onClick={() => onFiles(files.filter((_, fileIndex) => fileIndex !== index))}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
