'use client';

import { useState } from 'react';
import { FolderPlus, Loader2, X } from 'lucide-react';

interface CreateProjectModalProps {
  open: boolean;
  creating: boolean;
  onClose: () => void;
  onCreate: (payload: { name: string; code: string; description?: string; location?: string }) => Promise<void>;
}

export function CreateProjectModal({ open, creating, onClose, onCreate }: CreateProjectModalProps) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');

  if (!open) {
    return null;
  }

  async function submit(): Promise<void> {
    await onCreate({
      name: name.trim(),
      code: code.trim(),
      description: description.trim() || undefined,
      location: location.trim() || undefined,
    });
    setName('');
    setCode('');
    setDescription('');
    setLocation('');
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/50 px-4">
      <div className="w-full max-w-xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-2xl rounded-lg">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Create project</h2>
            <p className="text-sm text-[var(--color-text-secondary)]">Documents, search, and processing are scoped by project.</p>
          </div>
          <button type="button" className="rounded-md p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]" onClick={onClose} disabled={creating} aria-label="Close create project dialog">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-5">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">Project name</span>
            <input
              className="h-10 w-full rounded-lg border border-[var(--color-input)] px-3 text-sm outline-none ring-[var(--color-focus-ring)] focus:border-[var(--color-ring)] focus:ring-2"
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={creating}
              placeholder="Data Centre Expansion"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">Project code</span>
            <input
              className="h-10 w-full rounded-lg border border-[var(--color-input)] px-3 text-sm uppercase outline-none ring-[var(--color-focus-ring)] focus:border-[var(--color-ring)] focus:ring-2"
              value={code}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
              disabled={creating}
              placeholder="DC-2026-001"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">Location</span>
            <input
              className="h-10 w-full rounded-lg border border-[var(--color-input)] px-3 text-sm outline-none ring-[var(--color-focus-ring)] focus:border-[var(--color-ring)] focus:ring-2"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              disabled={creating}
              placeholder="Mumbai"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">Description</span>
            <textarea
              className="min-h-24 w-full resize-y rounded-lg border border-[var(--color-input)] px-3 py-2 text-sm outline-none ring-[var(--color-focus-ring)] focus:border-[var(--color-ring)] focus:ring-2"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              disabled={creating}
              placeholder="Scope, phase, or delivery notes"
            />
          </label>
        </div>

        <div className="flex justify-end gap-3 border-t border-[var(--color-border)] px-5 py-4">
          <button type="button" className="rounded-lg border border-[var(--color-input)] px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]" onClick={onClose} disabled={creating}>
            Cancel
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={() => void submit()}
            disabled={creating || name.trim().length < 2 || code.trim().length < 2}
          >
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderPlus className="h-4 w-4" />}
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
