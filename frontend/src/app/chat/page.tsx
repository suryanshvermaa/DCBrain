'use client';

import React, { useEffect, useState, useRef } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import * as projectsApi from '@/lib/api/projects';
import { Bot, Send, User, FileText, Download, BookOpen, Hash } from 'lucide-react';
import { useAppSelector } from '@/lib/hooks';
import { selectAccessToken } from '@/features/auth/authSlice';
import './chat.css';

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
    <div className="chat-sources">
      <div className="chat-sources-header">
        <FileText />
        Sources
      </div>
      <div className="chat-source-pills">
        {parsed.map((src, i) => (
          <button
            key={i}
            className={`chat-source-pill ${activeIdx === i ? 'active' : ''}`}
            onClick={() => setActiveIdx(activeIdx === i ? null : i)}
            title={src.document}
          >
            <BookOpen />
            {src.document.length > 28 ? src.document.slice(0, 26) + '…' : src.document}
            {src.page && <span style={{ opacity: 0.75 }}>·p{src.page}</span>}
          </button>
        ))}
      </div>
      {active && (
        <div className="chat-source-detail">
          <div className="chat-source-detail-meta">
            <span className="chat-source-badge doc">
              <FileText style={{ width: 10, height: 10 }} />
              {active.document}
            </span>
            {active.page && (
              <span className="chat-source-badge page">
                <Hash style={{ width: 10, height: 10 }} />
                Page {active.page}
              </span>
            )}
          </div>
          <div>{active.content}</div>
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

  return (
      <div className="chat-page">
        {/* ── Header ── */}
        <header className="chat-header">
          <div className="chat-header-left">
            <div className="chat-header-icon">
              <Bot size={16} />
            </div>
            <h1>Project Chat</h1>
          </div>
          <div className="chat-header-right">
            {activeSessionId && (
              <button
                onClick={handleExportPDF}
                disabled={isExporting}
                className="chat-export-btn"
                title="Export Chat to PDF"
              >
                <Download size={13} />
                {isExporting ? 'Exporting…' : 'Export PDF'}
              </button>
            )}
            {projects.length > 0 && (
              <select
                className="chat-project-select"
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
        </header>

        <div className="chat-layout">
          {/* ── Sidebar ── */}
          <aside className="chat-sidebar">
            <div className="chat-sidebar-header">
              <button
                onClick={handleCreateSession}
                disabled={!projectId}
                className="chat-new-btn"
              >
                + New Chat
              </button>
            </div>
            <div className="chat-session-list">
              {sessions.map((s) => (
                <div
                  key={s.id}
                  className={`chat-session-item ${activeSessionId === s.id ? 'active' : ''}`}
                  onClick={() => setActiveSessionId(s.id)}
                >
                  <div className="chat-session-title">{s.title}</div>
                  <div className="chat-session-date">
                    {new Date(s.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              ))}
            </div>
          </aside>

          {/* ── Main Chat ── */}
          <main className="chat-main">
            <div className="chat-messages">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 820, width: '100%', margin: '0 auto', minHeight: '100%' }}>
                {messages.length === 0 && !isSending && (
                  <div className="chat-empty">
                    <div className="chat-empty-icon">
                      <Bot size={26} />
                    </div>
                    <p>
                      {projectId
                        ? 'Ask anything about your project documents.'
                        : 'Create a project first to start chatting.'}
                    </p>
                  </div>
                )}

                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`chat-message ${msg.role === 'USER' ? 'user' : 'assistant'}`}
                  >
                    <div className="chat-bubble">
                      {msg.role === 'USER' ? (
                        <div style={{ padding: '12px 16px' }}>
                          <div className="chat-bubble-meta">
                            <User size={13} />
                            You
                          </div>
                          <div className="chat-bubble-content">{msg.content}</div>
                        </div>
                      ) : (
                        <>
                          <div className="chat-bubble-body">
                            <div className="chat-bubble-meta">
                              <Bot size={13} />
                              DCBrain
                            </div>
                            <div className="chat-bubble-content">{msg.content}</div>
                          </div>
                          {msg.sources && Array.isArray(msg.sources) && msg.sources.length > 0 && (
                            <SourcesPanel sources={msg.sources as Array<{ content: string }>} />
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))}

                {/* Typing indicator */}
                {isSending && (
                  <div className="chat-message assistant">
                    <div className="chat-typing">
                      <span /><span /><span />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* ── Input ── */}
            <div className="chat-input-area">
              <form onSubmit={handleSendMessage} className="chat-input-form">
                <input
                  type="text"
                  className="chat-input"
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
                  className="chat-send-btn"
                  disabled={!activeSessionId || !inputValue.trim() || isSending}
                >
                  <Send size={17} />
                </button>
              </form>
            </div>
          </main>
        </div>
      </div>
  );
}

export default function ChatPage() {
  return (
    <ProtectedRoute>
      <ChatPageContent />
    </ProtectedRoute>
  );
}
