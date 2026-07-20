'use client';

import React, { useEffect, useState, useRef } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import * as projectsApi from '@/lib/api/projects';
import { Bot, Send, User, FileText, Download, BookOpen, Hash, Trash2 } from 'lucide-react';
import { MarkdownRenderer } from '@/components/common/MarkdownRenderer';
import { useAppSelector } from '@/lib/hooks';
import { selectAccessToken } from '@/features/auth/authSlice';

// Parse raw source string into structured data
// Format: "[Source N] Document: name.pdf, Page: X\nContent: ..."
function parseSource(raw: string, index: number) {
  const docMatch = raw.match(/Document:\s*([^,\n]+)/i);
  const pageMatch = raw.match(/Page:\s*(\d+)/i);
  const contentMatch = raw.match(/Content:\s*([\s\S]+)/i);
  return {
    index: index + 1,
    document: docMatch?.[1]?.trim() ?? `Source ${index + 1}`,
    page: pageMatch?.[1] ? parseInt(pageMatch[1]) : null,
    content: contentMatch?.[1]?.trim() ?? raw.trim(),
  };
}

type ParsedSource = ReturnType<typeof parseSource>;

function SourcesPanel({ sources }: { sources: Array<{ content: string }> }) {
  const [activeIdx, setActiveIdx] = useState<number | null>(0);
  const parsed: ParsedSource[] = sources.map((s, i) => parseSource(s.content, i));
  const active = activeIdx !== null ? parsed[activeIdx] : null;

  return (
    <div className="mt-4 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-xl overflow-hidden flex flex-col shadow-sm max-w-full">
      <div className="flex items-center gap-2 bg-[var(--color-surface-raised)] border-b border-[var(--color-divider)] px-4 py-3 text-sm font-semibold text-[var(--color-text-primary)]">
        <FileText size={16} />
        Sources
      </div>
      <div className="flex gap-2 p-3 overflow-x-auto scrollbar-thin border-b border-[var(--color-divider)]">
        {parsed.map((src, i) => (
          <button
            key={i}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium whitespace-nowrap border transition-all ${
              activeIdx === i 
                ? 'bg-[var(--color-primary-100)] text-[var(--color-primary)] border-[var(--color-primary)]' 
                : 'bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:border-[var(--color-input)] hover:text-[var(--color-text-primary)]'
            }`}
            onClick={() => setActiveIdx(activeIdx === i ? null : i)}
            title={src.document}
          >
            <BookOpen size={13} />
            {src.document.length > 28 ? src.document.slice(0, 26) + '…' : src.document}
            {src.page && <span className="opacity-75">·p{src.page}</span>}
          </button>
        ))}
      </div>
      {active && (
        <div className="p-4 bg-[var(--color-surface-raised)] text-sm leading-relaxed text-[var(--color-text-secondary)]">
          <div className="flex items-center gap-3 mb-3 pb-3 border-b border-[var(--color-divider)]">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[var(--color-primary-100)] text-[var(--color-primary)] font-medium text-xs">
              <FileText size={12} />
              {active.document}
            </span>
            {active.page && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] border border-[var(--color-border)] font-medium text-xs">
                <Hash size={12} />
                Page {active.page}
              </span>
            )}
          </div>
          <div className="whitespace-pre-wrap">{active.content}</div>
        </div>
      )}
    </div>
  );
}

function ChatPageContent() {
  const accessToken = useAppSelector(selectAccessToken);
  const [projects, setProjects] = useState<projectsApi.Project[]>([]);
  const [projectId, setProjectId] = useState<string | null>(null);

  const [sessions, setSessions] = useState<projectsApi.ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<projectsApi.ChatMessage[]>([]);

  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadProjects() {
      try {
        const result = await projectsApi.listProjects();
        setProjects(result.projects);
        if (result.projects.length > 0 && !projectId) {
          setProjectId(result.projects[0]!.id);
        }
      } catch (e) {
        console.error(e);
      }
    }
    if (accessToken) void loadProjects();
  }, [accessToken, projectId]);

  useEffect(() => {
    if (projectId) void loadSessions(projectId);
  }, [projectId]);

  useEffect(() => {
    if (projectId && activeSessionId) void loadMessages(projectId, activeSessionId);
  }, [projectId, activeSessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  async function loadSessions(pId: string) {
    try {
      const res = await projectsApi.listChatSessions(pId);
      setSessions(res.sessions);
      if (res.sessions.length > 0 && !activeSessionId) {
        setActiveSessionId(res.sessions[0]!.id);
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function loadMessages(pId: string, sId: string) {
    try {
      const res = await projectsApi.getChatMessages(pId, sId);
      setMessages(res.messages);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleDeleteSession(e: React.MouseEvent, sessionId: string) {
    e.stopPropagation();
    if (!projectId) return;
    try {
      await projectsApi.deleteChatSession(projectId, sessionId);
      const remaining = sessions.filter((s) => s.id !== sessionId);
      setSessions(remaining);
      if (activeSessionId === sessionId) {
        if (remaining.length > 0) {
          setActiveSessionId(remaining[0]!.id);
        } else {
          setActiveSessionId(null);
          setMessages([]);
        }
      }
    } catch (err) {
      console.error('Failed to delete session', err);
    }
  }

  async function handleCreateSession() {
    if (!projectId) return;
    try {
      const res = await projectsApi.createChatSession(projectId, 'New Chat');
      setSessions([res.session, ...sessions]);
      setActiveSessionId(res.session.id);
      setMessages([]);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleClearAllSessions() {
    if (!projectId || sessions.length === 0) return;
    if (!window.confirm('Are you sure you want to delete all previous chat sessions?')) return;
    try {
      for (const s of sessions) {
        await projectsApi.deleteChatSession(projectId, s.id);
      }
      setSessions([]);
      setActiveSessionId(null);
      setMessages([]);
    } catch (err) {
      console.error('Failed to clear sessions', err);
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!inputValue.trim() || !projectId || !activeSessionId) return;

    const content = inputValue;
    setInputValue('');
    setIsSending(true);

    const tempMessage: projectsApi.ChatMessage = {
      id: 'temp-' + Date.now(),
      role: 'USER',
      content,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMessage]);

    try {
      await projectsApi.sendChatMessage(projectId, activeSessionId, content);
      await loadMessages(projectId, activeSessionId);
      await loadSessions(projectId);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSending(false);
    }
  }

  async function handleExportPDF() {
    if (!projectId || !activeSessionId) return;
    try {
      setIsExporting(true);
      const blob = await projectsApi.exportChatSessionPDF(projectId, activeSessionId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chat-export-${activeSessionId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e) {
      console.error(e);
    } finally {
      setIsExporting(false);
    }
  }

  const headerActions = (
    <div className="flex items-center gap-3">
      {activeSessionId && (
        <button
          onClick={handleExportPDF}
          disabled={isExporting}
          className="inline-flex h-9 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-hover)] disabled:opacity-50 gap-2"
          title="Export Chat to PDF"
        >
          <Download size={13} />
          {isExporting ? 'Exporting…' : 'Export PDF'}
        </button>
      )}
      {projects.length > 0 && (
        <select
          className="h-9 min-w-44 rounded-lg border border-[var(--color-input)] bg-[var(--color-input-bg)] px-3 text-sm text-[var(--color-text-primary)] outline-none transition-colors focus:border-[var(--color-ring)] focus:ring-2 focus:ring-[var(--color-focus-ring)]"
          value={projectId ?? ''}
          onChange={(e) => {
            setProjectId(e.target.value);
            setActiveSessionId(null);
            setMessages([]);
          }}
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      )}
    </div>
  );

  return (
    <AppShell title="Project Chat" subtitle="Chat with DCBrain grounded in your project documents" headerActions={headerActions}>
      <div className="flex h-full max-h-full">
        {/* ── Sidebar ── */}
        <aside className="w-64 flex flex-col border-r border-[var(--color-divider)] bg-[var(--color-surface)]">
          <div className="p-4 border-b border-[var(--color-divider)]">
            <button
              onClick={handleCreateSession}
              disabled={!projectId}
              className="w-full inline-flex h-10 items-center justify-center rounded-lg bg-[var(--color-primary)] px-4 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-hover)] disabled:opacity-50 disabled:bg-[var(--color-border)]"
            >
              + New Chat
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {sessions.map((s) => (
              <div
                key={s.id}
                className={`group relative flex items-center justify-between gap-2 p-3 rounded-lg cursor-pointer transition-colors ${activeSessionId === s.id ? 'bg-[var(--color-primary-100)] text-[var(--color-primary)]' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]'}`}
                onClick={() => setActiveSessionId(s.id)}
              >
                <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                  <div className="font-semibold text-sm truncate">{s.title}</div>
                  <div className="text-xs opacity-75">
                    {new Date(s.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => handleDeleteSession(e, s.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/40 transition-all shrink-0"
                  title="Delete chat session"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
          {sessions.length > 0 && (
            <div className="p-3 border-t border-[var(--color-divider)]">
              <button
                type="button"
                onClick={handleClearAllSessions}
                className="w-full inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-900/20 px-3 text-xs font-medium text-red-600 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                title="Delete all previous chat sessions"
              >
                <Trash2 size={13} /> Delete Previous Chats
              </button>
            </div>
          )}
        </aside>

        {/* ── Main Chat ── */}
        <main className="flex-1 flex flex-col min-w-0 bg-[var(--color-bg)] relative">
          <div className="flex-1 overflow-y-auto p-6 md:p-10 scrollbar-thin">
            <div className="flex flex-col gap-8 max-w-4xl w-full mx-auto pb-10">
              {messages.length === 0 && !isSending && (
                <div className="flex flex-col items-center justify-center h-64 opacity-50">
                  <div className="w-16 h-16 bg-[var(--color-surface-hover)] rounded-full flex items-center justify-center text-[var(--color-text-secondary)] mb-4">
                    <Bot size={32} />
                  </div>
                  <p className="text-[var(--color-text-secondary)] font-medium text-lg">
                    {projectId
                      ? 'Ask anything about your project documents.'
                      : 'Create a project first to start chatting.'}
                  </p>
                </div>
              )}

              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'USER' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] rounded-2xl flex flex-col ${msg.role === 'USER' ? 'bg-[var(--color-primary)] text-white shadow-md rounded-br-none' : 'bg-transparent text-[var(--color-text-primary)] w-full'}`}>
                    {msg.role === 'USER' ? (
                      <div className="p-4 px-5">
                        <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-wider text-white/80">
                          <User size={14} />
                          You
                        </div>
                        <div className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.content}</div>
                      </div>
                    ) : (
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
                          <Bot size={14} />
                          DCBrain
                        </div>
                        <MarkdownRenderer content={msg.content} />
                        {msg.sources && Array.isArray(msg.sources) && msg.sources.length > 0 && (
                          <SourcesPanel sources={msg.sources as Array<{ content: string }>} />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {isSending && (
                <div className="flex justify-start">
                  <div className="bg-transparent flex flex-col w-full">
                    <div className="flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
                      <Bot size={14} />
                      DCBrain
                    </div>
                    <div className="flex items-center gap-1.5 h-6">
                      <span className="w-2 h-2 rounded-full bg-[var(--color-text-tertiary)] animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 rounded-full bg-[var(--color-text-tertiary)] animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 rounded-full bg-[var(--color-text-tertiary)] animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* ── Input ── */}
          <div className="p-4 md:p-6 bg-gradient-to-t from-[var(--color-bg)] via-[var(--color-bg)] to-transparent shrink-0">
            <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto relative flex items-center shadow-lg rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] p-2 focus-within:ring-2 focus-within:ring-[var(--color-focus-ring)] focus-within:border-[var(--color-primary)] transition-all">
              <input
                type="text"
                className="flex-1 bg-transparent border-none outline-none px-4 py-3 text-[15px] text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] disabled:opacity-50"
                placeholder={
                  !projectId
                    ? 'Create a project to ask questions…'
                    : !activeSessionId
                    ? "Click '+ New Chat' to start a conversation…"
                    : 'Ask a question about your project…'
                }
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={!activeSessionId || isSending || !projectId}
              />
              <button
                type="submit"
                className="flex items-center justify-center w-11 h-11 rounded-xl bg-[var(--color-primary)] text-white transition-transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
                disabled={!activeSessionId || !inputValue.trim() || isSending}
              >
                <Send size={18} />
              </button>
            </form>
          </div>
        </main>
      </div>
    </AppShell>
  );
}

export default function ChatPage() {
  return (
    <ProtectedRoute>
      <ChatPageContent />
    </ProtectedRoute>
  );
}
