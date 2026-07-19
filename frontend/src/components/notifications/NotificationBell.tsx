'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Bell,
  Info,
  AlertTriangle,
  Shield,
  CheckCircle,
  Clock,
  Settings,
  Check,
} from 'lucide-react';
import Link from 'next/link';
import { useAppSelector } from '@/lib/hooks';
import { selectAccessToken } from '@/features/auth/authSlice';
import * as api from '@/lib/api/notifications';
import { api as baseApiClient } from '@/lib/api';

export function NotificationBell() {
  const accessToken = useAppSelector(selectAccessToken);
  const [notifications, setNotifications] = useState<api.ProjectNotification[]>([]);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<WebSocket | null>(null);

  // Fetch initial notifications
  const loadNotifications = async () => {
    try {
      const res = await api.listNotifications();
      setNotifications(res.notifications);
    } catch (err) {
      console.error('Failed to load notifications', err);
    }
  };

  useEffect(() => {
    if (accessToken) {
      void loadNotifications();
    }
  }, [accessToken]);

  // Connect to WebSocket
  useEffect(() => {
    let reconnectTimer: ReturnType<typeof setTimeout>;
    let reconnectAttempts = 0;
    const MAX_RECONNECT_DELAY = 30000;

    const connect = () => {
      if (!accessToken) {
        if (socketRef.current) {
          socketRef.current.close();
          socketRef.current = null;
        }
        return;
      }

      const baseApiUrl = baseApiClient.getBaseUrl();
      const wsProto = baseApiUrl.startsWith('https') ? 'wss' : 'ws';
      const hostPort = baseApiUrl.replace(/^https?:\/\//, '');
      const wsUrl = `${wsProto}://${hostPort}/ws?token=${encodeURIComponent(accessToken)}`;

      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        console.log('WebSocket connected for notifications');
        reconnectAttempts = 0; // Reset attempts on successful connection
      };

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.event === 'notification') {
            setNotifications((prev) => [payload.data, ...prev]);

            try {
              const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
              const osc = audioCtx.createOscillator();
              const gainNode = audioCtx.createGain();
              osc.connect(gainNode);
              gainNode.connect(audioCtx.destination);
              osc.frequency.setValueAtTime(880, audioCtx.currentTime);
              gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
              gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
              osc.start();
              osc.stop(audioCtx.currentTime + 0.3);
            } catch {
              // Audio context blocked/unsupported — ignore
            }
          }
        } catch (err) {
          console.error('Error handling websocket message', err);
        }
      };

      socket.onclose = () => {
        console.log('WebSocket disconnected');
        socketRef.current = null;
        if (accessToken) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), MAX_RECONNECT_DELAY);
          console.log(`Reconnecting WebSocket in ${delay}ms...`);
          reconnectTimer = setTimeout(() => {
            reconnectAttempts++;
            connect();
          }, delay);
        }
      };
      
      socket.onerror = (err) => {
        console.error('WebSocket connection error:', err);
        // onclose will be triggered automatically after onerror
      };
    };

    connect();

    return () => {
      clearTimeout(reconnectTimer);
      if (socketRef.current) {
        // Prevent onclose reconnect logic from triggering during unmount
        socketRef.current.onclose = null;
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [accessToken]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, read: true, readAt: new Date().toISOString() } : n,
        ),
      );
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.markAllAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read: true, readAt: new Date().toISOString() })),
      );
    } catch (err) {
      console.error('Failed to mark all notifications as read', err);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'SUCCESS':
      case 'DOCUMENT_READY':
        return <CheckCircle className="h-5 w-5 shrink-0 text-[var(--color-success)]" />;
      case 'WARNING':
      case 'COMPLIANCE_ISSUE':
        return <AlertTriangle className="h-5 w-5 shrink-0 text-[var(--color-warning)]" />;
      case 'ERROR':
        return <AlertTriangle className="h-5 w-5 shrink-0 text-[var(--color-danger)]" />;
      case 'TASK_ASSIGNED':
        return <Clock className="h-5 w-5 shrink-0 text-purple-500" />;
      default:
        return <Info className="h-5 w-5 shrink-0 text-[var(--color-primary)]" />;
    }
  };

  const formatRelativeTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] transition-all duration-[var(--duration-base)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
        aria-label="View notifications"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Bell className={`h-4 w-4 ${unreadCount > 0 ? 'animate-swing' : ''}`} />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 w-4 animate-pulse items-center justify-center rounded-full bg-[var(--color-danger)] text-[10px] font-bold text-white ring-2 ring-[var(--color-surface)]">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 z-50 mt-2 flex max-h-[500px] w-80 flex-col overflow-hidden rounded-2xl border border-[var(--color-popover-border)] bg-[var(--color-popover)] shadow-[var(--shadow-xl)] animate-scale-in sm:w-96"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[var(--color-divider)] p-4">
            <span className="text-sm font-semibold text-[var(--color-text-primary)]">
              Notifications ({unreadCount} unread)
            </span>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs font-medium text-[var(--color-link)] transition-colors hover:text-[var(--color-link-hover)]"
                >
                  Mark all read
                </button>
              )}
              <Link
                href="/settings"
                onClick={() => setOpen(false)}
                className="text-[var(--color-text-tertiary)] transition-colors hover:text-[var(--color-text-primary)]"
                title="Notification settings"
              >
                <Settings className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Notification list */}
          <div className="scrollbar-thin flex-1 divide-y divide-[var(--color-divider)] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-sm text-[var(--color-text-tertiary)]">
                No notifications yet.
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`group relative flex gap-3 p-4 transition-colors hover:bg-[var(--color-surface-hover)] ${
                    !notification.read
                      ? 'bg-[hsla(221,83%,53%,0.05)]'
                      : ''
                  }`}
                >
                  {getNotificationIcon(notification.type)}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-[var(--color-text-primary)]">
                      {notification.title}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-[var(--color-text-secondary)]">
                      {notification.message}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[10px] text-[var(--color-text-tertiary)]">
                        {formatRelativeTime(notification.createdAt)}
                      </span>
                      {notification.link && (
                        <Link
                          href={notification.link}
                          onClick={() => setOpen(false)}
                          className="text-[10px] font-semibold text-[var(--color-link)] transition-colors hover:text-[var(--color-link-hover)]"
                        >
                          View Action
                        </Link>
                      )}
                    </div>
                  </div>
                  {!notification.read && (
                    <button
                      onClick={(e) => handleMarkAsRead(notification.id, e)}
                      className="absolute right-4 top-4 rounded p-1 opacity-0 transition-all hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-success)] group-hover:opacity-100"
                      title="Mark as read"
                    >
                      <Check className="h-3 w-3 text-[var(--color-text-tertiary)]" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
