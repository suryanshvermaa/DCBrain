'use client';

import React, { type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  AlertOctagon,
  ClipboardList,
  Zap,
  GitPullRequest,
  CheckCircle,
  Network,
  BarChart3,
  Settings,
  Lock,
  ChevronRight,
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/lib/hooks';
import { selectAuthenticatedUser, clearAuth } from '@/features/auth/authSlice';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useRouter } from 'next/navigation';
import { api as baseApiClient } from '@/lib/api';

// ── Navigation items ──────────────────────────────────────────────────────────

const navigation = [
  { name: 'Dashboard',      href: '/',              icon: LayoutDashboard, exact: true },
  { name: 'Documents',      href: '/documents',     icon: FileText },
  { name: 'Search',         href: '/search',        icon: Search },
  { name: 'Chat',           href: '/chat',          icon: Bot },
  { name: 'Compliance',     href: '/compliance',    icon: Shield },
  { name: 'Schedule',       href: '/schedule',      icon: Calendar },
  { name: 'Procurement',    href: '/procurement',   icon: Package },
  { name: 'Simulations',    href: '/simulations',   icon: Activity },
  { name: 'RFIs',           href: '/rfis',          icon: HelpCircle },
  { name: 'NCRs',           href: '/ncrs',          icon: AlertOctagon },
  { name: 'Inspections',    href: '/inspections',   icon: ClipboardList },
  { name: 'Commissioning',  href: '/commissioning', icon: Zap },
  { name: 'Change Orders',  href: '/change-orders', icon: GitPullRequest },
  { name: 'Quality',        href: '/quality',       icon: CheckCircle },
  { name: 'Agents',         href: '/agents',        icon: Bot },
  { name: 'Knowledge Graph',href: '/graph',         icon: Network },
  { name: 'Reports',        href: '/reports',       icon: BarChart3 },
  { name: 'Settings',       href: '/settings',      icon: Settings },
];

// ── NavItem ───────────────────────────────────────────────────────────────────

function NavItem({
  item,
  pathname,
}: {
  item: (typeof navigation)[number];
  pathname: string;
}) {
  const isActive = item.exact
    ? pathname === item.href
    : pathname === item.href || pathname.startsWith(item.href + '/');

  return (
    <Link
      href={item.href}
      className={`
        group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium
        transition-all duration-[var(--duration-base)]
        ${isActive
          ? 'bg-[var(--color-sidebar-active)] text-[var(--color-sidebar-active-text)]'
          : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-sidebar-hover)] hover:text-[var(--color-text-primary)]'
        }
      `}
    >
      <item.icon
        className={`h-4 w-4 shrink-0 transition-colors duration-[var(--duration-base)]
          ${isActive
            ? 'text-[var(--color-sidebar-active-text)]'
            : 'text-[var(--color-text-tertiary)] group-hover:text-[var(--color-text-secondary)]'
          }
        `}
      />
      <span className="truncate">{item.name}</span>
      {isActive && (
        <ChevronRight className="ml-auto h-3.5 w-3.5 shrink-0 opacity-50" />
      )}
    </Link>
  );
}

// ── AppShell ──────────────────────────────────────────────────────────────────

interface AppShellProps {
  /** Page heading shown in the header */
  title: string;
  /** Optional subtitle below the heading */
  subtitle?: string;
  /** Slot rendered to the right of the notification bell in the header */
  headerActions?: ReactNode;
  children: ReactNode;
}

export function AppShell({ title, subtitle, headerActions, children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectAuthenticatedUser);

  const handleLogout = async () => {
    try {
      const baseUrl = baseApiClient.getBaseUrl();
      const token = baseApiClient.getToken();
      await fetch(`${baseUrl}/api/v1/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      // Ignore network errors — just clear state
    } finally {
      dispatch(clearAuth());
      router.push('/login');
    }
  };

  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase() || 'U';

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-bg)]">
      {/* ── Sidebar ──────────────────────────────────────────────────── */}
      <aside className="flex w-64 shrink-0 flex-col border-r border-[var(--color-sidebar-border)] bg-[var(--color-sidebar-bg)] transition-colors duration-[var(--duration-base)]">
        {/* Logo */}
        <div className="flex items-center gap-3 border-b border-[var(--color-sidebar-border)] px-6 py-5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary)] shadow-sm">
            <LayoutDashboard className="h-4.5 w-4.5 text-white" />
          </span>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-[var(--color-text-primary)]">
              DCBrain
            </h1>
            <p className="text-[10px] leading-tight text-[var(--color-text-tertiary)]">
              AI Platform · EPC
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="scrollbar-thin flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
          {navigation.map((item) => (
            <NavItem key={item.href} item={item} pathname={pathname} />
          ))}

          {/* Admin-only link */}
          {user?.role === 'ADMIN' && (
            <Link
              href="/admin/audit-log"
              className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-[var(--duration-base)]
                ${pathname.startsWith('/admin')
                  ? 'bg-[var(--color-sidebar-active)] text-[var(--color-sidebar-active-text)]'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-sidebar-hover)] hover:text-[var(--color-text-primary)]'
                }
              `}
            >
              <Shield className="h-4 w-4 shrink-0 text-[var(--color-danger)]" />
              Audit Logs
            </Link>
          )}
        </nav>

        {/* User / Sign-out footer */}
        <div className="border-t border-[var(--color-sidebar-border)] px-3 py-3">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-[10px] font-bold text-white">
              {initials}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-[var(--color-text-primary)]">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="truncate text-[10px] text-[var(--color-text-tertiary)] capitalize">
                {user?.role?.toLowerCase() ?? 'user'}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-[var(--color-danger-text)] transition-colors duration-[var(--duration-base)] hover:bg-[var(--color-danger-bg)]"
          >
            <Lock className="h-4 w-4 shrink-0" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--color-header-border)] bg-[var(--color-header-bg)] px-8 py-4 transition-colors duration-[var(--duration-base)]">
          <div>
            <h2 className="text-lg font-semibold leading-tight text-[var(--color-text-primary)]">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-0.5 text-sm text-[var(--color-text-secondary)]">{subtitle}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {headerActions}
            <div className="h-5 w-px bg-[var(--color-border)]" />
            <ThemeToggle />
            <div className="h-5 w-px bg-[var(--color-border)]" />
            <NotificationBell />
          </div>
        </header>

        {/* Page body */}
        <main className="scrollbar-thin flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
