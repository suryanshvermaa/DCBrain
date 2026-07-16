'use client';

import React, { useEffect, useState } from 'react';
import {
  User, Bell, Mail, CheckCircle, AlertCircle, Loader2, Shield, Lock, Eye, EyeOff,
} from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { useAppSelector } from '@/lib/hooks';
import { selectAuthenticatedUser } from '@/features/auth/authSlice';
import * as notifApi from '@/lib/api/notifications';
import { changePassword } from '@/lib/api/auth';

function SettingsPageContent() {
  const user = useAppSelector(selectAuthenticatedUser);

  // ── Notification prefs ────────────────────────────────────────────────────
  const [inApp, setInApp] = useState(true);
  const [emailDigest, setEmailDigest] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notifMsg, setNotifMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    async function loadPreferences() {
      try {
        setLoading(true);
        const res = await notifApi.getPreferences();
        setInApp(res.preferences.inApp);
        setEmailDigest(res.preferences.emailDigest);
      } catch (err) {
        console.error('Failed to load preferences', err);
      } finally {
        setLoading(false);
      }
    }
    void loadPreferences();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setNotifMsg(null);
    try {
      await notifApi.updatePreferences({ inApp, emailDigest });
      setNotifMsg({ type: 'success', text: 'Preferences saved successfully' });
    } catch (err) {
      setNotifMsg({ type: 'error', text: 'Failed to save preferences' });
    } finally {
      setSaving(false);
    }
  };

  // ── Change password ───────────────────────────────────────────────────────
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const setPwField = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setPwForm((f) => ({ ...f, [k]: e.target.value }));

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(null);
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwMsg({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    if (pwForm.newPassword.length < 8) {
      setPwMsg({ type: 'error', text: 'New password must be at least 8 characters' });
      return;
    }
    setPwSaving(true);
    try {
      await changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPwMsg({ type: 'success', text: 'Password changed successfully' });
    } catch (err: unknown) {
      setPwMsg({ type: 'error', text: err instanceof Error ? err.message : 'Failed to change password' });
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <AppShell title="Settings" subtitle="Manage your account preferences">
      <div className="p-8 max-w-2xl mx-auto w-full space-y-8">

        {/* ── Profile ─────────────────────────────────────────────────────── */}
        <section className="card-level-1 overflow-hidden transition-theme">
          <div className="flex items-center gap-3 border-b border-[var(--color-divider)] p-5">
            <User className="h-5 w-5 text-[var(--color-primary)]" />
            <h3 className="font-semibold text-[var(--color-text-primary)]">Profile</h3>
          </div>
          <div className="p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-primary)]/15 text-lg font-bold text-[var(--color-primary)]">
                {user ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() : '?'}
              </div>
              <div>
                <p className="font-semibold text-[var(--color-text-primary)]">
                  {user ? `${user.firstName} ${user.lastName}` : '—'}
                </p>
                <p className="text-sm text-[var(--color-text-secondary)]">{user?.email}</p>
                <span className="mt-1 inline-block rounded-full bg-[var(--color-primary)]/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-primary)]">
                  {user?.role?.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Security — Change Password ───────────────────────────────────── */}
        <section className="card-level-1 overflow-hidden transition-theme">
          <div className="flex items-center gap-3 border-b border-[var(--color-divider)] p-5">
            <Lock className="h-5 w-5 text-[var(--color-primary)]" />
            <div>
              <h3 className="font-semibold text-[var(--color-text-primary)]">Security</h3>
              <p className="text-xs text-[var(--color-text-tertiary)]">Change your login password</p>
            </div>
          </div>
          <form onSubmit={handleChangePassword} className="p-5 space-y-4">
            {pwMsg && (
              <div className={`flex items-center gap-2 rounded-xl border p-3 text-sm ${
                pwMsg.type === 'success'
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                  : 'border-red-500/30 bg-red-500/10 text-red-400'
              }`}>
                {pwMsg.type === 'success' ? <CheckCircle className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
                {pwMsg.text}
              </div>
            )}

            {/* Current password */}
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[var(--color-text-tertiary)]">
                Current Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-tertiary)]" />
                <input
                  type={showCurrentPw ? 'text' : 'password'}
                  value={pwForm.currentPassword}
                  onChange={setPwField('currentPassword')}
                  placeholder="Your current password"
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-input-bg)] py-2.5 pl-10 pr-10 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
                />
                <button type="button" onClick={() => setShowCurrentPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]">
                  {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* New password */}
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[var(--color-text-tertiary)]">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-tertiary)]" />
                <input
                  type={showNewPw ? 'text' : 'password'}
                  value={pwForm.newPassword}
                  onChange={setPwField('newPassword')}
                  placeholder="Min 8 characters"
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-input-bg)] py-2.5 pl-10 pr-10 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
                />
                <button type="button" onClick={() => setShowNewPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]">
                  {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Confirm */}
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[var(--color-text-tertiary)]">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-tertiary)]" />
                <input
                  type="password"
                  value={pwForm.confirmPassword}
                  onChange={setPwField('confirmPassword')}
                  placeholder="Repeat new password"
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-input-bg)] py-2.5 pl-10 pr-4 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={pwSaving || !pwForm.currentPassword || !pwForm.newPassword || !pwForm.confirmPassword}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pwSaving
                ? <><Loader2 className="h-4 w-4 animate-spin" />Updating…</>
                : <><Lock className="h-4 w-4" />Update Password</>
              }
            </button>
          </form>
        </section>

        {/* ── Notification Preferences ─────────────────────────────────────── */}
        <section className="card-level-1 overflow-hidden transition-theme">
          <div className="flex items-center gap-3 border-b border-[var(--color-divider)] p-5">
            <Bell className="h-5 w-5 text-[var(--color-primary)]" />
            <div>
              <h3 className="font-semibold text-[var(--color-text-primary)]">Notification Preferences</h3>
              <p className="text-xs text-[var(--color-text-tertiary)]">Choose how you receive updates</p>
            </div>
          </div>
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-[var(--color-text-secondary)]">
              <Loader2 className="h-4 w-4 animate-spin text-[var(--color-primary)]" />Loading preferences…
            </div>
          ) : (
            <div className="p-5 space-y-4">
              {notifMsg && (
                <div className={`flex items-center gap-2 rounded-xl border p-3 text-sm ${
                  notifMsg.type === 'success'
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                    : 'border-red-500/30 bg-red-500/10 text-red-400'
                }`}>
                  {notifMsg.type === 'success' ? <CheckCircle className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
                  {notifMsg.text}
                </div>
              )}

              <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-[var(--color-border)] p-4 hover:bg-[var(--color-surface-hover)] transition-colors">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-[var(--color-primary)]" />
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">In-App Notifications</p>
                    <p className="text-xs text-[var(--color-text-secondary)]">See alerts in the app bell icon</p>
                  </div>
                </div>
                <div className={`relative h-6 w-11 rounded-full transition-colors ${inApp ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'}`}>
                  <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${inApp ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  <input type="checkbox" checked={inApp} onChange={(e) => setInApp(e.target.checked)} className="sr-only" />
                </div>
              </label>

              <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-[var(--color-border)] p-4 hover:bg-[var(--color-surface-hover)] transition-colors">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-[var(--color-primary)]" />
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">Email Digest</p>
                    <p className="text-xs text-[var(--color-text-secondary)]">Daily summary delivered to your inbox</p>
                  </div>
                </div>
                <div className={`relative h-6 w-11 rounded-full transition-colors ${emailDigest ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'}`}>
                  <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${emailDigest ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  <input type="checkbox" checked={emailDigest} onChange={(e) => setEmailDigest(e.target.checked)} className="sr-only" />
                </div>
              </label>

              <button
                onClick={handleSave}
                disabled={saving}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {saving ? <><Loader2 className="h-4 w-4 animate-spin" />Saving…</> : <><CheckCircle className="h-4 w-4" />Save Preferences</>}
              </button>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <SettingsPageContent />
    </ProtectedRoute>
  );
}
