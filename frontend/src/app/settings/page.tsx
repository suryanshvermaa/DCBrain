'use client';

import React, { useEffect, useState } from 'react';
import {
  User,
  Bell,
  Mail,
  CheckCircle,
  AlertCircle,
  Loader2,
  Shield,
} from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { useAppSelector } from '@/lib/hooks';
import { selectAuthenticatedUser } from '@/features/auth/authSlice';
import * as notifApi from '@/lib/api/notifications';

function SettingsPageContent() {
  const user = useAppSelector(selectAuthenticatedUser);
  const [inApp, setInApp] = useState(true);
  const [emailDigest, setEmailDigest] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

  const handleSavePreferences = async (newInApp: boolean, newEmail: boolean) => {
    setSaving(true);
    setMessage(null);
    try {
      await notifApi.updatePreferences({ inApp: newInApp, emailDigest: newEmail });
      setMessage({ type: 'success', text: 'Notification preferences updated successfully.' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to update preferences.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell
      title="Settings"
      subtitle="Configure your profile and system preferences"
    >
      <div className="p-8 max-w-4xl mx-auto w-full space-y-8">
        {/* Feedback message */}
        {message && (
          <div
            className={`flex items-center gap-3 rounded-xl border p-4 text-sm ${
              message.type === 'success'
                ? 'status-success border'
                : 'status-danger border'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle className="h-5 w-5 shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 shrink-0" />
            )}
            {message.text}
          </div>
        )}

        {/* User Profile Card */}
        <section className="card-level-1 flex flex-col gap-6 p-6 transition-theme">
          <div className="flex items-center gap-3 border-b border-[var(--color-divider)] pb-4">
            <User className="h-5 w-5 text-[var(--color-primary)]" />
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
              User Profile
            </h3>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {[
              { label: 'First Name', value: user?.firstName },
              { label: 'Last Name',  value: user?.lastName },
              { label: 'Email Address', value: user?.email },
            ].map(({ label, value }) => (
              <div key={label}>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-[var(--color-text-tertiary)]">
                  {label}
                </label>
                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-input-bg)] px-4 py-2.5 text-sm text-[var(--color-text-primary)]">
                  {value || '—'}
                </div>
              </div>
            ))}

            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-[var(--color-text-tertiary)]">
                System Role
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-input-bg)] px-4 py-2.5 text-sm font-semibold text-[var(--color-primary)] capitalize">
                <Shield className="h-4 w-4 shrink-0" />
                {user?.role?.toLowerCase() || '—'}
              </div>
            </div>
          </div>
        </section>

        {/* Notification Preferences Card */}
        <section className="card-level-1 flex flex-col gap-6 p-6 transition-theme">
          <div className="flex items-center gap-3 border-b border-[var(--color-divider)] pb-4">
            <Bell className="h-5 w-5 text-[var(--color-primary)]" />
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
              Notification Preferences
            </h3>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-3 py-8 text-sm text-[var(--color-text-secondary)]">
              <Loader2 className="h-5 w-5 animate-spin text-[var(--color-primary)]" />
              Loading settings…
            </div>
          ) : (
            <div className="space-y-4">
              {/* In-App Notifications */}
              <div className="flex items-start justify-between gap-4 rounded-xl border border-[var(--color-border)] p-4 transition-colors hover:bg-[var(--color-surface-hover)]">
                <div className="flex items-start gap-3">
                  <Bell className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-primary)]" />
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">
                      Real-time In-App Alerts
                    </p>
                    <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                      Receive instant compliance, document processing, and agent result updates directly on the dashboard.
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex shrink-0 cursor-pointer select-none items-center">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={inApp}
                    onChange={(e) => {
                      const val = e.target.checked;
                      setInApp(val);
                      void handleSavePreferences(val, emailDigest);
                    }}
                    disabled={saving}
                  />
                  <div className="h-6 w-11 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-raised)] transition-colors peer-checked:border-[var(--color-primary)] peer-checked:bg-[var(--color-primary)] after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-[var(--color-border)] after:bg-[var(--color-surface)] after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white peer-checked:after:bg-white" />
                </label>
              </div>

              {/* Email Digest */}
              <div className="flex items-start justify-between gap-4 rounded-xl border border-[var(--color-border)] p-4 transition-colors hover:bg-[var(--color-surface-hover)]">
                <div className="flex items-start gap-3">
                  <Mail className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-primary)]" />
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">
                      Daily Email Digest
                    </p>
                    <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                      Get a summary email containing report notifications and active RFIs at the end of the day.
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex shrink-0 cursor-pointer select-none items-center">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={emailDigest}
                    onChange={(e) => {
                      const val = e.target.checked;
                      setEmailDigest(val);
                      void handleSavePreferences(inApp, val);
                    }}
                    disabled={saving}
                  />
                  <div className="h-6 w-11 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-raised)] transition-colors peer-checked:border-[var(--color-primary)] peer-checked:bg-[var(--color-primary)] after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-[var(--color-border)] after:bg-[var(--color-surface)] after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white peer-checked:after:bg-white" />
                </label>
              </div>
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
