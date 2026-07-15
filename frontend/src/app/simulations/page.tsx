'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bot,
  Calendar,
  ChevronRight,
  FileText,
  HelpCircle,
  LayoutDashboard,
  Loader2,
  Package,
  Plus,
  Search,
  Settings,
  Shield,
  Network,
  Activity
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import * as projectsApi from '@/lib/api/projects';
import * as simulationsApi from '@/lib/api/simulations';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Documents', href: '/documents', icon: FileText },
  { name: 'Search', href: '/search', icon: Search },
  { name: 'Chat', href: '/chat', icon: Bot },
  { name: 'Compliance', href: '/compliance', icon: Shield },
  { name: 'Schedule', href: '/schedule', icon: Calendar },
  { name: 'Procurement', href: '/procurement', icon: Package },
  { name: 'RFIs', href: '/rfis', icon: HelpCircle },
  { name: 'Agents', href: '/agents', icon: Bot },
  { name: 'Knowledge Graph', href: '/graph', icon: Network },
  { name: 'Simulations', href: '/simulations', icon: Activity },
  { name: 'Settings', href: '/settings', icon: Settings },
];

function SimulationsPageContent() {
  const pathname = usePathname();
  const [projects, setProjects] = useState<projectsApi.Project[]>([]);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [simulations, setSimulations] = useState<simulationsApi.Simulation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProjects() {
      try {
        const result = await projectsApi.listProjects();
        setProjects(result.projects);
        if (result.projects.length > 0) {
          setProjectId(result.projects[0].id);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load projects');
      }
    }
    void loadProjects();
  }, []);

  const loadSimulations = useCallback(async (pid: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await simulationsApi.listSimulations(pid);
      setSimulations(result);
    } catch (err: any) {
      setError(err.message || 'Failed to load simulations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (projectId) {
      void loadSimulations(projectId);
    }
  }, [projectId, loadSimulations]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex overflow-hidden">
      <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </span>
            DCBrain
          </h1>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-7xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <Activity className="w-7 h-7 text-blue-600" />
                Simulations
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                Run what-if scenario simulations to analyze delay propagation and generate mitigation plans.
              </p>
            </div>
            <div className="flex items-center gap-3">
              {projects.length > 0 && (
                <select
                  value={projectId ?? ''}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              )}
              <Link
                href={`/simulations/new${projectId ? `?projectId=${projectId}` : ''}`}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Simulation
              </Link>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Simulation History</h3>
              {loading && <Loader2 className="w-5 h-5 animate-spin text-blue-600" />}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <th className="px-6 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Name</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Target Activity</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Delay</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Status</th>
                    <th className="px-6 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {simulations.map((sim) => (
                    <tr key={sim.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                      <td className="px-6 py-3 font-medium text-gray-900 dark:text-white">{sim.name}</td>
                      <td className="px-6 py-3 text-gray-600 dark:text-gray-400">{sim.targetActivityId}</td>
                      <td className="px-6 py-3 text-gray-600 dark:text-gray-400">{sim.delayDays} days</td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs ${sim.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : sim.status === 'FAILED' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {sim.status}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <Link
                          href={`/simulations/${sim.id}?projectId=${projectId}`}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 inline-flex items-center gap-1 text-xs"
                        >
                          View Results <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {!loading && simulations.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                        <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="font-medium">No simulations run yet</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function SimulationsPage() {
  return (
    <ProtectedRoute>
      <SimulationsPageContent />
    </ProtectedRoute>
  );
}
