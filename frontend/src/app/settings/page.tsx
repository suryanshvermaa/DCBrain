'use client';

import React, { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  FileText,
  Search,
  Bot,
  Shield,
  Calendar,
  Package,
  Activity,
  HelpCircle,
  Network,
  BarChart3,
  Settings,
  User,
  Bell,
  Mail,
  CheckCircle,
  AlertCircle,
  Loader2,
  Lock,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { selectAuthenticatedUser, clearAuth } from '@/features/auth/authSlice';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import * as notifApi from '@/lib/api/notifications';
import { api as baseApiClient } from '@/lib/api';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Documents', href: '/documents', icon: FileText },
  { name: 'Search', href: '/search', icon: Search },
  { name: 'Chat', href: '/chat', icon: Bot },
  { name: 'Compliance', href: '/compliance', icon: Shield },
  { name: 'Schedule', href: '/schedule', icon: Calendar },
  { name: 'Procurement', href: '/procurement', icon: Package },
  { name: 'Simulations', href: '/simulations', icon: Activity },
  { name: 'RFIs', href: '/rfis', icon: HelpCircle },
  { name: 'Agents', href: '/agents', icon: Bot },
  { name: 'Knowledge Graph', href: '/graph', icon: Network },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

function SettingsPageContent() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
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
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update preferences.' });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      // Direct call to backend logout
      const baseUrl = baseApiClient.getBaseUrl();
      const token = baseApiClient.getToken();
      await fetch(`${baseUrl}/api/v1/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      // Clear redux state and redirect
      dispatch(clearAuth());
      router.push('/login');
    } catch (err) {
      console.error('Logout failed', err);
      // Fallback: just clear client state anyway
      dispatch(clearAuth());
      router.push('/login');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="w-8 h-8 bg-sky-600 rounded-lg flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </span>
            DCBrain
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            AI Platform for Data Centre EPC
          </p>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const active = item.href === '/settings';
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  active
                    ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
          {user?.role === 'ADMIN' && (
            <Link
              href="/admin/audit-log"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            >
              <Lock className="w-5 h-5" />
              Audit Logs
            </Link>
          )}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors cursor-pointer"
          >
            <Lock className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-slate-900 border-b border-slate-800 px-8 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Settings</h2>
            <p className="text-xs text-slate-500">Configure your profile and system preferences</p>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell />
            <div className="h-8 w-px bg-slate-800" />
            <div className="flex items-center gap-2">
              <span className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-sky-400 font-bold">
                {user?.firstName?.[0] ?? 'U'}
              </span>
              <span className="text-xs text-slate-300 font-medium">
                {user?.firstName} {user?.lastName}
              </span>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <div className="p-8 max-w-4xl mx-auto w-full space-y-8">
          {message && (
            <div
              className={`p-4 rounded-xl border flex items-center gap-3 text-sm ${
                message.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
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

          {/* User Profile Info Card */}
          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col gap-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
              <User className="h-5 w-5 text-sky-400" />
              <h3 className="font-semibold text-lg">User Profile</h3>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                  First Name
                </label>
                <div className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-300">
                  {user?.firstName || '—'}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                  Last Name
                </label>
                <div className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-300">
                  {user?.lastName || '—'}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                  Email Address
                </label>
                <div className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-300">
                  {user?.email || '—'}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                  System Role
                </label>
                <div className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-300 font-semibold capitalize text-sky-400 flex items-center gap-2">
                  <Shield className="h-4 w-4 shrink-0" />
                  {user?.role?.toLowerCase() || '—'}
                </div>
              </div>
            </div>
          </section>

          {/* Notifications Preferences Card */}
          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col gap-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
              <Bell className="h-5 w-5 text-sky-400" />
              <h3 className="font-semibold text-lg">Notification Preferences</h3>
            </div>

            {loading ? (
              <div className="py-8 flex items-center justify-center text-sm text-slate-500 gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-sky-400" />
                Loading settings…
              </div>
            ) : (
              <div className="space-y-6">
                {/* Preference Option 1 */}
                <div className="flex items-start justify-between gap-4 p-4 rounded-xl hover:bg-slate-800/30 transition-all border border-slate-800/30">
                  <div className="flex items-start gap-3">
                    <Bell className="h-5 w-5 text-sky-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-slate-200">Real-time In-App Alerts</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Receive instant compliance, document processing, and agent result updates directly on the dashboard.
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
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
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500 peer-checked:after:bg-white peer-checked:after:border-sky-500"></div>
                  </label>
                </div>

                {/* Preference Option 2 */}
                <div className="flex items-start justify-between gap-4 p-4 rounded-xl hover:bg-slate-800/30 transition-all border border-slate-800/30">
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-sky-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-slate-200">Daily Email Digest</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Get a summary email containing report notifications and active RFIs at the end of the day.
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
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
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500 peer-checked:after:bg-white peer-checked:after:border-sky-500"></div>
                  </label>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <SettingsPageContent />
    </ProtectedRoute>
  );
}
