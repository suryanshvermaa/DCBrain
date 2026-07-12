'use client';

import React, { useEffect, useState, useRef } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import * as projectsApi from '@/lib/api/projects';
import { Bot, Send, User, FileText, Download } from 'lucide-react';
import { useAppSelector } from '@/lib/hooks';
import { selectAccessToken } from '@/features/auth/authSlice';

export default function ChatPage() {
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
        // Only set default if we don't already have one selected
        if (result.projects.length > 0 && !projectId) {
          setProjectId(result.projects[0]!.id);
        }
      } catch (e) {
        console.error(e);
      }
    }
    // Only attempt to load when the access token is fully ready
    if (accessToken) {
      void loadProjects();
    }
  }, [accessToken, projectId]);

  useEffect(() => {
    if (projectId) {
      void loadSessions(projectId);
    }
  }, [projectId]);

  useEffect(() => {
    if (projectId && activeSessionId) {
      void loadMessages(projectId, activeSessionId);
    }
  }, [projectId, activeSessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

    // Optimistic UI
    const tempMessage: projectsApi.ChatMessage = {
      id: 'temp-' + Date.now(),
      role: 'USER',
      content,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMessage]);

    try {
      await projectsApi.sendChatMessage(projectId, activeSessionId, content);
      // Reload messages to get the user msg + assistant msg with sources
      await loadMessages(projectId, activeSessionId);
      // Reload sessions to update title if needed
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
    <ProtectedRoute>
      <div className="flex flex-col h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        {/* Header */}
        <header className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <Bot className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h1 className="text-xl font-semibold">Project Chat</h1>
          </div>
          <div className="flex items-center gap-4">
            {activeSessionId && (
              <button
                onClick={handleExportPDF}
                disabled={isExporting}
                className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                title="Export Chat to PDF"
              >
                <Download className="w-4 h-4" />
                {isExporting ? 'Exporting...' : 'Export PDF'}
              </button>
            )}
            {projects.length > 0 && (
            <select
              className="px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:border-blue-500"
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

        <div className="flex flex-1 overflow-hidden min-h-0">
          {/* Sidebar */}
          <aside className="w-[300px] bg-gray-50 dark:bg-gray-800/50 border-r border-gray-200 dark:border-gray-700 flex flex-col shrink-0">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
              <button
                onClick={handleCreateSession}
                disabled={!projectId}
                className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                + New Chat
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
              {sessions.map((s) => (
                <div
                  key={s.id}
                  className={`p-3 rounded-lg cursor-pointer border flex flex-col transition-colors ${
                    activeSessionId === s.id 
                      ? 'bg-blue-50 border-blue-500 dark:bg-blue-900/20 dark:border-blue-400' 
                      : 'border-transparent bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => setActiveSessionId(s.id)}
                >
                  <div className="font-medium text-sm mb-1 truncate">{s.title}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(s.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </aside>

          {/* Main Chat Area */}
          <main className="flex-1 flex flex-col bg-white dark:bg-gray-900 min-w-0">
            <div className="flex-1 overflow-y-auto p-6">
              <div className="flex flex-col gap-4 max-w-4xl mx-auto w-full h-full">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <Bot className="w-12 h-12 mb-4 opacity-50" />
                    {projectId ? (
                      <p>Start a conversation about your project documents.</p>
                    ) : (
                      <p>Please create a project first to start chatting.</p>
                    )}
                  </div>
                )}
                {messages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`flex max-w-[85%] ${msg.role === 'USER' ? 'self-end' : 'self-start'}`}
                  >
                    <div className={`p-4 rounded-2xl text-[0.95rem] leading-relaxed shadow-sm ${
                      msg.role === 'USER'
                        ? 'bg-blue-600 text-white rounded-br-sm'
                        : 'bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700/50 text-gray-900 dark:text-gray-100 rounded-bl-sm backdrop-blur-sm'
                    }`}>
                      <div className="flex items-center gap-2 mb-2 opacity-75 text-xs font-medium">
                        {msg.role === 'USER' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                        <span>{msg.role === 'USER' ? 'You' : 'DCBrain'}</span>
                      </div>
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                      
                      {/* Sources rendering */}
                      {msg.sources && Array.isArray(msg.sources) && msg.sources.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700/50">
                          <p className="text-xs font-semibold mb-2 flex items-center gap-1">
                            <FileText className="w-3 h-3" /> Sources
                          </p>
                          <div className="flex flex-col gap-2">
                            {msg.sources.map((src: { content: string }, i: number) => (
                              <div key={i} className="text-xs bg-gray-100 dark:bg-gray-900/50 p-3 rounded-lg text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700/30">
                                {src.content}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      

                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 shrink-0">
              <form onSubmit={handleSendMessage} className="flex gap-2 max-w-4xl mx-auto w-full">
                <input
                  type="text"
                  className="flex-1 px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-[0.95rem] focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
                  placeholder={!projectId ? "Create a project to ask questions..." : !activeSessionId ? "Click '+ New Chat' to start a conversation..." : "Ask a question about your project..."}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  disabled={!activeSessionId || isSending || !projectId}
                />
                <button
                  type="submit"
                  className={`flex items-center justify-center px-6 rounded-lg font-medium transition-all shadow-sm ${
                    !activeSessionId || !inputValue.trim() || isSending
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none dark:bg-gray-800 dark:text-gray-500'
                      : 'bg-blue-500 text-white hover:bg-blue-600 cursor-pointer shadow-sm'
                  }`}
                  disabled={!activeSessionId || !inputValue.trim() || isSending}
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
