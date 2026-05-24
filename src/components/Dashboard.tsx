'use client';

import { useCallback, useEffect, useState } from 'react';
import { useToast } from '@/lib/toast';
import { supabaseBrowser } from '@/lib/supabase';
import {
  getAccessibleMatters,
  getAccessibleSessions,
} from '@/lib/ethical-wall';
import {
  getSystemStats,
} from '@/lib/audit-trail';
import { Matter, AISession, BlockedAccessEvent, DashboardMetrics } from '@/lib/types';
import { MetricsCards } from './MetricsCards';
import { SessionList } from './SessionList';
import { BlockedAccessLog } from './BlockedAccessLog';
import { HashChainVerification } from './HashChainVerification';
import { ReviewPanel } from './ReviewPanel';
import { ExportButton } from './ExportButton';

export function Dashboard() {
  const [matters, setMatters] = useState<Matter[]>([]);
  const [sessions, setSessions] = useState<AISession[]>([]);
  const [blockedEvents, setBlockedEvents] = useState<BlockedAccessEvent[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    total_sessions: 0,
    reviewed_count: 0,
    pending_count: 0,
    blocked_events: 0,
    pending_reviews: 0,
    reviewed_percentage: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<'associate' | 'partner' | 'admin' | null>(null);
  
  // STEP 6: Defensive guard for useToast - prevent crash if provider missing
  let addToast: (type: 'info' | 'success' | 'warning' | 'error', message: string) => void;
  try {
    const toast = useToast();
    addToast = toast.addToast;
  } catch {
    // Fallback if ToastProvider not available
    addToast = () => console.warn('[BRAHMO] ToastProvider not available');
  }

  const loadData = useCallback(async (signal?: AbortSignal) => {
    try {
      setIsLoading(true);
      setError(null);

      // Get the current authenticated user
      const { data: { user }, error: authError } = await supabaseBrowser.auth.getUser();
      
      if (authError || !user) {
        throw new Error('Not authenticated');
      }

      // Fetch user role from users table
      const { data: userData, error: userError } = await supabaseBrowser
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (userError) {
        console.error('Failed to fetch user role:', userError);
        // Use default role if fetch fails
        setUserRole('associate');
      } else if (userData) {
        setUserRole(userData.role as 'associate' | 'partner' | 'admin');
      }

      if (signal?.aborted) return;

      // Fetch accessible matters (RLS enforced)
      const accessibleMatters = await getAccessibleMatters();
      if (signal?.aborted) return;
      setMatters(accessibleMatters);

      // Fetch accessible sessions (RLS enforced)
      const accessibleSessions = await getAccessibleSessions();
      if (signal?.aborted) return;
      setSessions(accessibleSessions);

      // Fetch blocked events (only for partners)
      if (userData?.role === 'partner') {
        const { data: blocked, error: blockedError } = await supabaseBrowser
          .from('blocked_access_log')
          .select('*')
          .order('timestamp', { ascending: false });

        if (blockedError) {
          console.error('Blocked events fetch error:', blockedError);
          addToast('warning', 'Unable to load blocked access log');
        } else if (!signal?.aborted) {
          setBlockedEvents(blocked || []);
        }
      }

      // Fetch system statistics
      const stats = await getSystemStats();
      if (signal?.aborted) return;
      setMetrics({
        total_sessions: stats.total_sessions,
        reviewed_count: stats.reviewed_count,
        pending_count: stats.pending_reviews,
        blocked_events: stats.blocked_events,
        pending_reviews: stats.pending_reviews,
        reviewed_percentage: stats.reviewed_percentage,
      });
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load data');
      addToast('error', 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);


  const handleReviewSubmit = async (
    sessionId: string,
    decision: string,
    notes: string
  ) => {
    try {
      const { data: { user }, error: authError } = await supabaseBrowser.auth.getUser();
      
      if (authError || !user) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          reviewer_id: user.id,
          decision,
          notes,
        }),
      });

      if (!response.ok) {
        throw new Error('Review submission failed');
      }

      // Reload data
      await loadData();
    } catch (err) {
      console.error('Review submission error:', err);
      addToast('error', 'Failed to submit review');
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    loadData(controller.signal);
    return () => controller.abort();
  }, [loadData]);

  const isPartner = userRole === 'partner';

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Metrics */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">System Overview</h2>
        <MetricsCards metrics={metrics} isLoading={isLoading} />
      </div>

      {/* Accessible Matters */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Accessible Matters ({matters.length})
        </h2>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="p-4 bg-slate-100 rounded-lg animate-pulse h-16" />
            ))}
          </div>
        ) : matters.length === 0 ? (
          <div className="p-6 text-center border border-slate-200 rounded-lg bg-slate-50">
            <p className="text-slate-600 font-medium">No accessible matters</p>
            <p className="text-xs text-slate-500 mt-1">
              {userRole === 'associate' ? 'Associates have limited matter access' : 'No matters available'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {matters.map((matter) => (
              <div
                key={matter.id}
                className="p-4 border border-blue-200 rounded-lg bg-blue-50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">{matter.matter_name}</p>
                    <p className="text-xs text-slate-600 mt-1">{matter.practice_area}</p>
                    {matter.court && (
                      <p className="text-xs text-slate-500">{matter.court}</p>
                    )}
                  </div>
                  <span className="text-xs px-2 py-1 bg-blue-200 text-blue-800 rounded">
                    {matter.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sessions */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Recent Sessions ({sessions.length})
        </h2>
        <SessionList sessions={sessions} isLoading={isLoading} />
      </div>

      {/* Blocked Access Log (Partner Only) */}
      {isPartner && (
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Blocked Access Log (Immutable)
          </h2>
          <HashChainVerification events={blockedEvents} />
          <div className="mt-4">
            <BlockedAccessLog events={blockedEvents} isLoading={isLoading} />
          </div>
        </div>
      )}

      {/* Review Panel (Partner Only) */}
      {isPartner && (
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Pending Reviews</h2>
          <ReviewPanel
            sessions={sessions}
            isLoading={isLoading}
            isPartner={isPartner}
            onReviewSubmit={handleReviewSubmit}
          />
        </div>
      )}

      {/* Export */}
      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
        <div>
          <p className="text-sm font-medium text-slate-900">Compliance Export</p>
          <p className="text-xs text-slate-600 mt-1">
            Download anonymized compliance report with all sessions and blocked events
          </p>
        </div>
        <ExportButton isPartner={isPartner} />
      </div>
    </div>
  );
}
