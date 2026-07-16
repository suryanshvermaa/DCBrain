'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Users, UserPlus, Shield, Mail, Loader2, Trash2, ChevronDown, X,
  CheckCircle, AlertCircle, Crown, RefreshCw, UserCog, Copy, Eye, EyeOff, Lock,
} from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { useAppSelector } from '@/lib/hooks';
import { selectAuthenticatedUser } from '@/features/auth/authSlice';
import * as projectsApi from '@/lib/api/projects';
import * as authApi from '@/lib/api/auth';

const ASSIGNABLE_ROLES: { value: string; label: string }[] = [
  { value: 'MANAGER', label: 'Manager' },
  { value: 'ENGINEER', label: 'Engineer' },
  { value: 'PROCUREMENT', label: 'Procurement' },
  { value: 'QA_QC', label: 'QA / QC' },
  { value: 'MEMBER', label: 'Member' },
  { value: 'VIEWER', label: 'Viewer' },
];

const GLOBAL_ROLES = ['ADMIN', 'PROJECT_MANAGER', 'ENGINEER', 'PROCUREMENT', 'QA_INSPECTOR', 'VIEWER'];

const ROLE_BADGE: Record<string, string> = {
  OWNER: 'bg-[var(--color-primary)]/15 text-[var(--color-primary)] border border-[var(--color-primary)]/30',
  MANAGER: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30',
  ENGINEER: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30',
  PROCUREMENT: 'bg-amber-500/10 text-amber-400 border border-amber-500/30',
  QA_QC: 'bg-purple-500/10 text-purple-400 border border-purple-500/30',
  MEMBER: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
  VIEWER: 'bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)] border border-[var(--color-border)]',
};

function canManageMembers(user: { role: string } | null, myMembership: projectsApi.ProjectMember | null): boolean {
  if (!user) return false;
  if (user.role === 'ADMIN' || user.role === 'PROJECT_MANAGER') return true;
  if (!myMembership) return false;
  return myMembership.role === 'OWNER' || myMembership.role === 'MANAGER';
}

// ─────────────────────────────────────────────────────────────────────────────
// Credentials display (shown once after user creation)
// ─────────────────────────────────────────────────────────────────────────────
function CredentialCard({ label, value, sensitive }: { label: string; value: string; sensitive?: boolean }) {
  const [revealed, setRevealed] = useState(!sensitive);
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-3">
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">{label}</p>
      <div className="flex items-center gap-2">
        <span className="flex-1 font-mono text-sm text-[var(--color-text-primary)]">
          {sensitive && !revealed ? '•'.repeat(value.length) : value}
        </span>
        {sensitive && (
          <button onClick={() => setRevealed((v) => !v)} className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]">
            {revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
        <button onClick={copy} className="text-[var(--color-text-tertiary)] hover:text-[var(--color-primary)]">
          {copied ? <CheckCircle className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

interface CredentialsModalProps {
  credentials: { email: string; password: string };
  userName: string;
  onClose: () => void;
}

function CredentialsModal({ credentials, userName, onClose }: CredentialsModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-emerald-500/30 bg-[var(--color-surface)] shadow-2xl"
        style={{ boxShadow: '0 0 60px rgba(16,185,129,0.12)' }}>
        <div className="flex items-center gap-3 border-b border-[var(--color-divider)] p-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15">
            <CheckCircle className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[var(--color-text-primary)]">User Created Successfully</h2>
            <p className="text-xs text-[var(--color-text-secondary)]">{userName}</p>
          </div>
          <button onClick={onClose} className="ml-auto rounded-lg p-1.5 text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-hover)]">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-amber-500/25 bg-amber-500/8 p-4 text-sm text-amber-400">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <p>These credentials are shown <strong>once</strong>. Copy and send them to the user via email. They should change their password after first login.</p>
          </div>

          <div className="space-y-3">
            <CredentialCard label="Email" value={credentials.email} />
            <CredentialCard label="Password" value={credentials.password} sensitive />
          </div>

          <button onClick={onClose}
            className="w-full rounded-xl bg-[var(--color-primary)] py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90">
            Done — I have saved the credentials
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Create User Modal (Admin IAM-style)
// ─────────────────────────────────────────────────────────────────────────────
interface CreateUserModalProps {
  onClose: () => void;
  onSuccess: (result: authApi.CreateUserResponse) => void;
}

function CreateUserModal({ onClose, onSuccess }: CreateUserModalProps) {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', role: 'VIEWER' });
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.email || !form.password) {
      setError('All fields are required');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const result = await authApi.adminCreateUser(form);
      onSuccess(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl"
        style={{ boxShadow: '0 0 60px rgba(99,102,241,0.12)' }}>
        <div className="flex items-center justify-between border-b border-[var(--color-divider)] p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-primary)]/15">
              <UserCog className="h-5 w-5 text-[var(--color-primary)]" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[var(--color-text-primary)]">Create Platform User</h2>
              <p className="text-xs text-[var(--color-text-secondary)]">Credentials shown once after creation</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-hover)]">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />{error}
            </div>
          )}

          {/* Name row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[var(--color-text-tertiary)]">First Name</label>
              <input value={form.firstName} onChange={set('firstName')} placeholder="Jane" autoFocus
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-input-bg)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[var(--color-text-tertiary)]">Last Name</label>
              <input value={form.lastName} onChange={set('lastName')} placeholder="Smith"
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-input-bg)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20" />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[var(--color-text-tertiary)]">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-tertiary)]" />
              <input type="email" value={form.email} onChange={set('email')} placeholder="jane.smith@company.com"
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-input-bg)] py-2.5 pl-10 pr-4 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20" />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[var(--color-text-tertiary)]">Initial Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-tertiary)]" />
              <input type={showPw ? 'text' : 'password'} value={form.password} onChange={set('password')} placeholder="Min 8 characters"
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-input-bg)] py-2.5 pl-10 pr-10 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20" />
              <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]">
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">User will be able to change this after first login.</p>
          </div>

          {/* Global Role */}
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[var(--color-text-tertiary)]">Platform Role</label>
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-tertiary)]" />
              <select value={form.role} onChange={set('role')}
                className="w-full appearance-none rounded-xl border border-[var(--color-border)] bg-[var(--color-input-bg)] py-2.5 pl-10 pr-8 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20">
                {GLOBAL_ROLES.map((r) => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-tertiary)]" />
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] py-2.5 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-hover)]">
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed">
              {submitting ? <><Loader2 className="h-4 w-4 animate-spin" />Creating…</> : <><UserCog className="h-4 w-4" />Create User</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Invite to Project Modal
// ─────────────────────────────────────────────────────────────────────────────
interface InviteModalProps {
  projectId: string;
  onClose: () => void;
  onSuccess: (member: projectsApi.ProjectMember) => void;
}

function InviteModal({ projectId, onClose, onSuccess }: InviteModalProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('MEMBER');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError('Email address is required'); return; }
    setError('');
    setSubmitting(true);
    try {
      const res = await projectsApi.inviteProjectMember(projectId, { email: email.trim(), role });
      onSuccess(res.member);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to invite member');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--color-divider)] p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-primary)]/15">
              <UserPlus className="h-5 w-5 text-[var(--color-primary)]" />
            </div>
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Add to Project</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-hover)]">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />{error}
            </div>
          )}
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[var(--color-text-tertiary)]">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-tertiary)]" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="colleague@company.com" autoFocus
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-input-bg)] py-2.5 pl-10 pr-4 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20" />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[var(--color-text-tertiary)]">Project Role</label>
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-tertiary)]" />
              <select value={role} onChange={(e) => setRole(e.target.value)}
                className="w-full appearance-none rounded-xl border border-[var(--color-border)] bg-[var(--color-input-bg)] py-2.5 pl-10 pr-8 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20">
                {ASSIGNABLE_ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-tertiary)]" />
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] py-2.5 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]">Cancel</button>
            <button type="submit" disabled={submitting}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50">
              {submitting ? <><Loader2 className="h-4 w-4 animate-spin" />Adding…</> : <><UserPlus className="h-4 w-4" />Add to Project</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────
function MembersPageContent() {
  const currentUser = useAppSelector(selectAuthenticatedUser);
  const isAdmin = currentUser?.role === 'ADMIN';

  const [projects, setProjects] = useState<projectsApi.Project[]>([]);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [members, setMembers] = useState<projectsApi.ProjectMember[]>([]);
  const [loading, setLoading] = useState(false);

  const [showInvite, setShowInvite] = useState(false);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newCredentials, setNewCredentials] = useState<{ email: string; password: string; name: string } | null>(null);

  const [roleChanging, setRoleChanging] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    projectsApi.listProjects().then((res) => {
      setProjects(res.projects);
      if (res.projects.length > 0) setProjectId(res.projects[0].id);
    }).catch(() => {});
  }, []);

  const loadMembers = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await projectsApi.getProjectMembers(projectId);
      setMembers(res.members);
    } catch {
      showToast('error', 'Failed to load project members');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { void loadMembers(); }, [loadMembers]);

  const myMembership = members.find((m) => m.id === currentUser?.id) ?? null;
  const canManage = canManageMembers(currentUser, myMembership);

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!projectId) return;
    setRoleChanging(userId);
    try {
      const res = await projectsApi.updateProjectMemberRole(projectId, userId, newRole);
      setMembers((prev) => prev.map((m) => (m.id === userId ? { ...m, role: res.member.role } : m)));
      showToast('success', 'Role updated');
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Failed to update role');
    } finally {
      setRoleChanging(null);
    }
  };

  const handleRemove = async (userId: string, name: string) => {
    if (!projectId) return;
    if (!confirm(`Remove "${name}" from this project?`)) return;
    setRemoving(userId);
    try {
      await projectsApi.removeProjectMember(projectId, userId);
      setMembers((prev) => prev.filter((m) => m.id !== userId));
      showToast('success', `${name} removed`);
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Failed to remove member');
    } finally {
      setRemoving(null);
    }
  };

  const handleInviteSuccess = (member: projectsApi.ProjectMember) => {
    setShowInvite(false);
    setMembers((prev) => {
      const exists = prev.find((m) => m.id === member.id);
      if (exists) return prev.map((m) => (m.id === member.id ? member : m));
      return [...prev, member];
    });
    showToast('success', `${member.name} added to project`);
  };

  const handleCreateUserSuccess = (result: authApi.CreateUserResponse) => {
    setShowCreateUser(false);
    setNewCredentials({
      email: result.credentials.email,
      password: result.credentials.password,
      name: `${result.user.firstName} ${result.user.lastName}`,
    });
  };

  return (
    <AppShell title="Member Management" subtitle="Invite and manage workspace team members">
      <div className="p-8 max-w-5xl mx-auto w-full space-y-6">

        {/* Toast */}
        {toast && (
          <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border px-5 py-3 text-sm shadow-2xl ${toast.type === 'success' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-red-500/30 bg-red-500/10 text-red-400'}`}>
            {toast.type === 'success' ? <CheckCircle className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
            {toast.text}
          </div>
        )}

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <label className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-tertiary)]">Project</label>
            <div className="relative">
              <select value={projectId ?? ''} onChange={(e) => setProjectId(e.target.value)}
                className="appearance-none rounded-xl border border-[var(--color-border)] bg-[var(--color-input-bg)] py-2 pl-3 pr-8 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]">
                {projects.length === 0 && <option value="">No projects</option>}
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-tertiary)]" />
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={() => void loadMembers()}
              className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />Refresh
            </button>

            {/* Admin-only: Create new platform user */}
            {isAdmin && (
              <button id="create-user-btn" onClick={() => setShowCreateUser(true)}
                className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-2 text-sm font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface-hover)]">
                <UserCog className="h-4 w-4 text-[var(--color-primary)]" />Create User
              </button>
            )}

            {/* Add existing user to project */}
            {canManage && (
              <button id="invite-member-btn" onClick={() => setShowInvite(true)}
                className="flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90">
                <UserPlus className="h-4 w-4" />Add to Project
              </button>
            )}
          </div>
        </div>

        {/* Info strips */}
        {isAdmin && (
          <div className="flex items-center gap-3 rounded-xl border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/8 p-4 text-sm text-[var(--color-primary)]">
            <UserCog className="h-5 w-5 shrink-0" />
            <span><strong>Admin:</strong> Use <em>Create User</em> to provision new platform accounts. You set the initial password and share it via email. The user can change it from <em>Settings → Security</em> after first login.</span>
          </div>
        )}

        {!canManage && !isAdmin && (
          <div className="flex items-center gap-3 rounded-xl border border-amber-500/25 bg-amber-500/8 p-4 text-sm text-amber-400">
            <Shield className="h-5 w-5 shrink-0" />
            You have view-only access. Contact a Manager or Owner to make changes.
          </div>
        )}

        {/* Members table */}
        <section className="card-level-1 overflow-hidden transition-theme">
          <div className="flex items-center gap-3 border-b border-[var(--color-divider)] p-5">
            <Users className="h-5 w-5 text-[var(--color-primary)]" />
            <h3 className="font-semibold text-[var(--color-text-primary)]">
              Team Members
              {!loading && <span className="ml-2 text-xs font-normal text-[var(--color-text-tertiary)]">({members.length})</span>}
            </h3>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-3 py-16 text-sm text-[var(--color-text-secondary)]">
              <Loader2 className="h-5 w-5 animate-spin text-[var(--color-primary)]" />Loading members…
            </div>
          ) : members.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-sm text-[var(--color-text-secondary)]">
              <Users className="h-10 w-10 text-[var(--color-text-tertiary)]" />
              <p>No members yet.</p>
              {canManage && (
                <button onClick={() => setShowInvite(true)} className="mt-1 flex items-center gap-2 text-[var(--color-primary)] hover:underline">
                  <UserPlus className="h-4 w-4" />Add the first member
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-[var(--color-divider)]">
              {members.map((member) => {
                const isOwner = member.role === 'OWNER';
                const isMe = member.id === currentUser?.id;
                const isActioning = roleChanging === member.id || removing === member.id;
                return (
                  <div key={member.id} className="flex flex-wrap items-center gap-4 px-5 py-4 hover:bg-[var(--color-surface-hover)] transition-colors">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/15 text-sm font-semibold text-[var(--color-primary)]">
                      {member.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-[var(--color-text-primary)]">{member.name}</span>
                        {isMe && <span className="rounded-full bg-[var(--color-primary)]/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-primary)]">You</span>}
                        {isOwner && <span title="Project Owner"><Crown className="h-3.5 w-3.5 text-amber-400" /></span>}
                      </div>
                      <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">{member.email}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {canManage && !isOwner ? (
                        <div className="relative">
                          <select value={member.role} onChange={(e) => void handleRoleChange(member.id, e.target.value)} disabled={isActioning}
                            className={`appearance-none rounded-xl border py-1.5 pl-3 pr-7 text-xs font-medium outline-none disabled:opacity-60 cursor-pointer ${ROLE_BADGE[member.role] ?? ROLE_BADGE['VIEWER']}`}>
                            {ASSIGNABLE_ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 opacity-60" />
                        </div>
                      ) : (
                        <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${ROLE_BADGE[member.role] ?? ROLE_BADGE['VIEWER']}`}>
                          {member.role.replace('_', ' ')}
                        </span>
                      )}
                      {canManage && !isOwner && !isMe && (
                        <button onClick={() => void handleRemove(member.id, member.name)} disabled={isActioning}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-text-tertiary)] hover:bg-red-500/10 hover:text-red-400 disabled:opacity-40">
                          {removing === member.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </button>
                      )}
                      {roleChanging === member.id && <Loader2 className="h-4 w-4 animate-spin text-[var(--color-primary)]" />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {showInvite && projectId && (
        <InviteModal projectId={projectId} onClose={() => setShowInvite(false)} onSuccess={handleInviteSuccess} />
      )}

      {showCreateUser && (
        <CreateUserModal onClose={() => setShowCreateUser(false)} onSuccess={handleCreateUserSuccess} />
      )}

      {newCredentials && (
        <CredentialsModal
          credentials={{ email: newCredentials.email, password: newCredentials.password }}
          userName={newCredentials.name}
          onClose={() => setNewCredentials(null)}
        />
      )}
    </AppShell>
  );
}

export default function MembersPage() {
  return (
    <ProtectedRoute>
      <MembersPageContent />
    </ProtectedRoute>
  );
}
