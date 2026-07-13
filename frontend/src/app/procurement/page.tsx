'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Package, Upload, LayoutDashboard, FileText, Search, Bot, Shield, Calendar, Settings, HelpCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import * as projectsApi from '@/lib/api/projects';
import * as procurementApi from '@/lib/api/procurement';

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
  { name: 'Settings', href: '/settings', icon: Settings },
];

function ProcurementPageContent() {
  const pathname = usePathname();

  const [projects, setProjects] = useState<projectsApi.Project[]>([]);
  const [projectId, setProjectId] = useState<string | null>(null);
  
  const [items, setItems] = useState<procurementApi.ProcurementItem[]>([]);
  const [vendors, setVendors] = useState<procurementApi.Vendor[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

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

  const loadProcurementData = useCallback(async (pid: string) => {
    setLoading(true);
    setError(null);
    try {
      const [itemsRes, vendorsRes] = await Promise.all([
        procurementApi.getProcurementItems(pid),
        procurementApi.getVendors(pid)
      ]);
      setItems(itemsRes.items);
      setVendors(vendorsRes.vendors);
    } catch (err: any) {
      setError(err.message || 'Failed to load procurement data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (projectId) {
      void loadProcurementData(projectId);
    }
  }, [projectId, loadProcurementData]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !projectId) return;

    setUploading(true);
    setError(null);
    try {
      const result = await procurementApi.importProcurement(projectId, file);
      alert(`Successfully imported ${result.importedCount} items.`);
      void loadProcurementData(projectId);
    } catch (err: any) {
      setError(err.message || 'Failed to import file');
    } finally {
      setUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  const selectedProject = useMemo(() => projects.find((p) => p.id === projectId) ?? null, [projectId, projects]);

  return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex overflow-hidden">
        {/* Sidebar */}
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

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <header className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Procurement Intelligence</h2>
                {selectedProject && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedProject.name} ({selectedProject.code})
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <select
                  className="h-9 min-w-48 rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                  value={projectId ?? ''}
                  onChange={(e) => setProjectId(e.target.value || null)}
                >
                  {projects.length === 0 ? <option value="">No projects</option> : null}
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700">
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  Import CSV/XLSX
                  <input type="file" accept=".csv, .xlsx" className="hidden" onChange={handleFileUpload} disabled={uploading || !projectId} />
                </label>
              </div>
            </div>
          </header>

          <div className="p-8 space-y-8">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {loading ? (
              <div className="flex min-h-48 items-center justify-center text-sm text-gray-500">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Loading procurement data…
              </div>
            ) : items.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center text-sm text-gray-500">
                No procurement items found. Please import a procurement file.
              </div>
            ) : (
              <>
                <section className="grid gap-6 lg:grid-cols-3">
                   <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Total Items</h3>
                      <p className="text-3xl font-bold mt-2">{items.length}</p>
                   </div>
                   <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Vendors</h3>
                      <p className="text-3xl font-bold mt-2">{vendors.length}</p>
                   </div>
                   <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">At Risk Items</h3>
                      <p className="text-3xl font-bold mt-2 text-amber-600">
                         {items.filter(i => (i.status !== 'RECEIVED' && i.status !== 'INSTALLED') && i.requiredOnSiteDate && new Date(i.requiredOnSiteDate).getTime() < Date.now() + 30 * 24 * 60 * 60 * 1000).length}
                      </p>
                   </div>
                </section>

                <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Promised</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Required On Site</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {items.map((item) => (
                        <tr key={item.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{item.material}</div>
                            <div className="text-sm text-gray-500">Qty: {item.quantity} {item.unit} {item.poNumber ? `| PO: ${item.poNumber}` : ''}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{item.vendor?.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                              {item.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.promisedDate ? new Date(item.promisedDate).toLocaleDateString() : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.requiredOnSiteDate ? new Date(item.requiredOnSiteDate).toLocaleDateString() : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
  );
}

export default function ProcurementPage() {
  return (
    <ProtectedRoute>
      <ProcurementPageContent />
    </ProtectedRoute>
  );
}
