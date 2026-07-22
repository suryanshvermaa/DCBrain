'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Bot, AlertTriangle, Loader2 } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import * as simulationsApi from '@/lib/api/simulations';
import Link from 'next/link';
import { MarkdownRenderer } from '@/components/common/MarkdownRenderer';

function SimulationDetailPageContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  
  const simId = params.id as string;
  const projectId = searchParams.get('projectId');

  const [sim, setSim] = useState<simulationsApi.Simulation | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) {
      router.push('/simulations');
      return;
    }

    async function fetchSim() {
      try {
        const data = await simulationsApi.getSimulation(projectId!, simId);
        setSim(data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch simulation');
      } finally {
        setLoading(false);
      }
    }
    void fetchSim();
  }, [projectId, simId, router]);

  const handleMitigate = async () => {
    if (!projectId) return;
    setGenerating(true);
    try {
      const res = await simulationsApi.generateMitigationPlan(projectId, simId);
      setSim((prev) => prev ? { ...prev, mitigationPlans: res } : null);
    } catch (err: any) {
      setError(err.message || 'Failed to generate mitigation plan');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--color-bg)]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
      </div>
    );
  }

  if (error || !sim) {
    return (
      <div className="p-8 text-center text-red-600">
        <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
        <p>{error || 'Simulation not found'}</p>
        <Link href="/simulations" className="text-[var(--color-link)] underline mt-4 block">Back</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] p-8 text-[var(--color-text-primary)]">
      <div className="max-w-4xl mx-auto space-y-6">
        <Link
          href={`/simulations${projectId ? `?projectId=${projectId}` : ''}`}
          className="inline-flex items-center gap-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Simulations
        </Link>
        
        <div className="bg-[var(--color-surface)] p-6 rounded-xl border border-[var(--color-border)] shadow-sm">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">{sim.name}</h2>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">Target: {sim.targetActivityId} | Delay: {sim.delayDays} days</p>
            </div>
            <span className={`px-3 py-1.5 rounded-full text-xs font-bold border ${sim.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700' : sim.status === 'RUNNING' ? 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-700' : 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/40 dark:text-red-300 dark:border-red-700'}`}>
              {sim.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-[var(--color-surface-raised)] rounded-lg border border-[var(--color-divider)]">
              <p className="text-sm text-[var(--color-text-secondary)]">Estimated Cost Impact</p>
              <p className="text-xl font-bold text-amber-600 dark:text-amber-400">${sim.costImpact?.toLocaleString() ?? 0}</p>
            </div>
            <div className="p-4 bg-[var(--color-surface-raised)] rounded-lg border border-[var(--color-divider)]">
              <p className="text-sm text-[var(--color-text-secondary)]">Impacted Entities (Cascade)</p>
              <p className="text-xl font-bold text-orange-600 dark:text-orange-400">{sim.impacts?.length ?? 0}</p>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-3 text-[var(--color-text-primary)]">Failure Propagation Chain</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {sim.impacts?.length ? sim.impacts.map((i, idx) => (
                <div key={idx} className="p-3 bg-orange-50 dark:bg-orange-950/30 text-sm rounded-lg flex justify-between items-center border border-orange-200 dark:border-orange-800/40 gap-4">
                  <span className="font-semibold text-gray-900 dark:text-gray-100 truncate">{i.entityName}</span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 px-2.5 py-1 rounded-md font-bold border border-red-200 dark:border-red-800/40">
                      +{i.estimatedDelayDays} days
                    </span>
                    <span className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 px-2 py-1 rounded-md font-medium border border-amber-200 dark:border-amber-800/40">{i.labels.join(', ')}</span>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-[var(--color-text-secondary)]">No downstream cascade detected.</p>
              )}
            </div>
          </div>

          <div className="border-t border-[var(--color-border)] pt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                <Bot className="w-5 h-5 text-[var(--color-primary)]" />
                AI Mitigation Plan
              </h3>
              {!sim.mitigationPlans && sim.status === 'COMPLETED' && (
                <button
                  onClick={() => void handleMitigate()}
                  disabled={generating}
                  className="px-4 py-2 bg-[var(--color-primary)] text-[var(--color-primary-foreground)] rounded-lg hover:bg-[var(--color-primary-hover)] disabled:opacity-50 flex items-center gap-2 transition-colors font-medium"
                >
                  {generating && <Loader2 className="w-4 h-4 animate-spin" />}
                  Generate Mitigations
                </button>
              )}
            </div>

            {sim.mitigationPlans ? (
              <MarkdownRenderer content={sim.mitigationPlans.content} />
            ) : (
              <p className="text-sm text-[var(--color-text-secondary)]">No mitigation plans generated yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SimulationDetailPage() {
  return (
    <ProtectedRoute>
      <SimulationDetailPageContent />
    </ProtectedRoute>
  );
}
