'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Activity, ArrowLeft, Loader2 } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import * as simulationsApi from '@/lib/api/simulations';
import Link from 'next/link';

function NewSimulationPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId');
  
  const [name, setName] = useState('');
  const [targetActivityId, setTargetActivityId] = useState('');
  const [delayDays, setDelayDays] = useState('14');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);

  useEffect(() => {
    if (!projectId) {
      router.push('/simulations');
      return;
    }
    
    // Load schedule activities for the dropdown
    async function loadActivities() {
      setLoadingActivities(true);
      try {
        const { getScheduleActivities } = await import('@/lib/api/schedule');
        const res = await getScheduleActivities(projectId as string);
        setActivities(res.activities || []);
        if (res.activities?.length > 0) {
          setTargetActivityId(res.activities[0].activityId);
        }
      } catch (err) {
        console.error('Failed to load activities for dropdown', err);
      } finally {
        setLoadingActivities(false);
      }
    }
    loadActivities();
  }, [projectId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;

    setLoading(true);
    setError(null);
    try {
      const res = await simulationsApi.runDelaySimulation(projectId, {
        name,
        targetActivityId,
        delayDays: parseInt(delayDays) || 0,
        assumptions: { costPerDay: 5000 }, // Default cost per day
      });
      router.push(`/simulations/${res.id}?projectId=${projectId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to run simulation');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <Link
          href={`/simulations${projectId ? `?projectId=${projectId}` : ''}`}
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Simulations
        </Link>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3 mb-6">
            <Activity className="w-6 h-6 text-blue-600" />
            Run Delay Simulation
          </h2>

          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Scenario Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                placeholder="e.g. Chiller Delivery Delay"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Target Activity</label>
              {loadingActivities ? (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading activities...
                </div>
              ) : (
                <select
                  required
                  value={targetActivityId}
                  onChange={(e) => setTargetActivityId(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                >
                  <option value="" disabled>Select an activity</option>
                  {activities.map((act) => (
                    <option key={act.id} value={act.activityId}>
                      {act.activityId} - {act.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Delay (Days)</label>
              <input
                type="number"
                required
                min="1"
                value={delayDays}
                onChange={(e) => setDelayDays(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
              />
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Run Simulation
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function NewSimulationPage() {
  return (
    <ProtectedRoute>
      <NewSimulationPageContent />
    </ProtectedRoute>
  );
}
