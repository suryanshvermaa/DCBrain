'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Bell, Info, AlertTriangle, Shield, CheckCircle, Clock, Settings, Check } from 'lucide-react';
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
    if (!accessToken) {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      return;
    }

    const baseApiUrl = baseApiClient.getBaseUrl();
    const wsProto = baseApiUrl.startsWith('https') ? 'wss' : 'ws';
    // Remove protocol and build socket URL
    const hostPort = baseApiUrl.replace(/^https?:\/\//, '');
    const wsUrl = `${wsProto}://${hostPort}/ws?token=${encodeURIComponent(accessToken)}`;

    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log('WebSocket connected for notifications');
    };

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.event === 'notification') {
          // Prepend new notification to state
          setNotifications((prev) => [payload.data, ...prev]);

          // Play subtle notification chime (standard Web Audio API synth to avoid loading file assets)
          try {
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            osc.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
            gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.3);
          } catch {
            // Audio context blocked/unsupported, ignore
          }
        }
      } catch (err) {
        console.error('Error handling websocket message', err);
      }
    };

    socket.onclose = () => {
      console.log('WebSocket disconnected');
    };

    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, [accessToken]);

  // Close dropdown on click outside
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
        prev.map((n) => (n.id === id ? { ...n, read: true, readAt: new Date().toISOString() } : n))
      );
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true, readAt: new Date().toISOString() })));
    } catch (err) {
      console.error('Failed to mark all notifications as read', err);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'SUCCESS':
      case 'DOCUMENT_READY':
        return <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />;
      case 'WARNING':
      case 'COMPLIANCE_ISSUE':
        return <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />;
      case 'ERROR':
        return <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0" />;
      case 'TASK_ASSIGNED':
        return <Clock className="h-5 w-5 text-purple-400 shrink-0" />;
      default:
        return <Info className="h-5 w-5 text-sky-400 shrink-0" />;
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
        className="relative p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-all"
        aria-label="View notifications"
      >
        <Bell className={`h-5 w-5 ${unreadCount > 0 ? 'animate-swing' : ''}`} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-slate-900 animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-700/60 bg-slate-900/95 backdrop-blur-xl shadow-2xl z-50 overflow-hidden text-slate-100 flex flex-col max-h-[500px]">
          <div className="p-4 border-b border-slate-700/60 flex items-center justify-between">
            <span className="font-semibold text-sm">Notifications ({unreadCount} unread)</span>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-sky-400 hover:text-sky-300 font-medium transition-colors"
                >
                  Mark all read
                </button>
              )}
              <Link
                href="/settings"
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-slate-200 transition-colors"
                title="Notification settings"
              >
                <Settings className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">No notifications yet.</div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 flex gap-3 hover:bg-slate-800/40 transition-colors relative group ${
                    !notification.read ? 'bg-sky-500/5' : ''
                  }`}
                >
                  {getNotificationIcon(notification.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-200 truncate">{notification.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{notification.message}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px] text-slate-500">
                        {formatRelativeTime(notification.createdAt)}
                      </span>
                      {notification.link && (
                        <Link
                          href={notification.link}
                          onClick={() => setOpen(false)}
                          className="text-[10px] font-semibold text-sky-400 hover:text-sky-300 transition-colors"
                        >
                          View Action
                        </Link>
                      )}
                    </div>
                  </div>
                  {!notification.read && (
                    <button
                      onClick={(e) => handleMarkAsRead(notification.id, e)}
                      className="opacity-0 group-hover:opacity-100 absolute top-4 right-4 p-1 hover:bg-slate-700 rounded transition-all text-slate-400 hover:text-emerald-400"
                      title="Mark as read"
                    >
                      <Check className="h-3 w-3" />
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
