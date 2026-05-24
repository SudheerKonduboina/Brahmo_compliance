'use client';

import { useEffect, useState, useRef } from 'react';
import { supabaseBrowser } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { AlertCircle, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

interface PendingSession {
  id: string;
  user_id: string;
  matter_id: string;
  query_type: string;
  output_hash: string;
  created_at: string;
  review_status: string;
}

export function ReviewQueuePanel() {
  const { profile, user } = useAuth();
  const [sessions, setSessions] = useState<PendingSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const fetchStartedRef = useRef(false);
  const renderCountRef = useRef(0);

  renderCountRef.current++;
  console.log(`[REVIEW_QUEUE_PANEL] Render #${renderCountRef.current}, isLoading=${isLoading}, sessions.length=${sessions.length}`);

  useEffect(() => {
    if (fetchStartedRef.current) {
      console.log('[REVIEW_QUEUE_PANEL] Fetch already started, skipping');
      return;
    }
    fetchStartedRef.current = true;

    console.log('[REVIEW_QUEUE_PANEL] Fetch started');
    let mounted = true;

    const fetchPendingSessions = async () => {
      try {
        // Timeout protection
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Review queue fetch timeout')), 8000);
        });

        const { data, error: fetchError } = await Promise.race([
          supabaseBrowser
            .from('ai_sessions')
            .select('id, user_id, matter_id, query_type, output_hash, created_at, review_status')
            .eq('review_status', 'pending')
            .order('created_at', { ascending: true }),
          timeoutPromise
        ]) as any;

        if (fetchError) throw fetchError;

        if (mounted) {
          console.log('[REVIEW_QUEUE_PANEL] Fetch completed, data length:', data?.length || 0);
          setSessions(data || []);
        }
      } catch (err) {
        console.error('[REVIEW_QUEUE_PANEL] Fetch error:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch pending sessions');
        }
      } finally {
        if (mounted) {
          console.log('[REVIEW_QUEUE_PANEL] Setting loading false');
          setIsLoading(false);
        }
      }
    };

    fetchPendingSessions();

    return () => {
      console.log('[REVIEW_QUEUE_PANEL] Cleanup');
      mounted = false;
      fetchStartedRef.current = false;
      mountedRef.current = false;
    };
  }, []);

  const handleReview = async (sessionId: string, decision: 'approved' | 'rejected', notes?: string) => {
    setReviewingId(sessionId);
    try {
      const response = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          reviewer_id: user?.id,
          decision,
          notes: notes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Review failed');
      }

      // Remove from pending list
      setSessions(sessions.filter((s) => s.id !== sessionId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process review');
    } finally {
      setReviewingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Partner-only check */}
      {!(profile?.role === "partner" || user?.app_metadata?.role === "partner") ? (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-amber-900 mb-1">Partner-Only Feature</h3>
            <p className="text-sm text-amber-800">
              Only partners can review AI sessions. You are not authorized to access this feature.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Inline loading indicator */}
          {isLoading && (
            <div className="flex items-center justify-center py-4">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 mb-2 animate-pulse">
                  <div className="w-3 h-3 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin" />
                </div>
                <p className="text-xs text-slate-600">Loading review queue...</p>
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900 mb-1">Error Loading Queue</h3>
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && !error && sessions.length === 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-300 mx-auto mb-4" />
              <p className="text-slate-600 font-medium mb-1">No Pending Reviews</p>
              <p className="text-sm text-slate-500">
                All AI sessions have been reviewed. Great job staying on top of compliance!
              </p>
            </div>
          )}

          {/* Content */}
          {!isLoading && !error && sessions.length > 0 && (
            <div>
              {/* Queue stats */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-emerald-900 mb-1">
                    {sessions.length} Session{sessions.length !== 1 ? 's' : ''} Pending Review
                  </p>
                  <p className="text-sm text-emerald-800">
                    Review AI session outputs to ensure compliance with ethical walls and firm policies.
                  </p>
                </div>
              </div>

              {/* Review cards */}
              <div className="space-y-4">
                {sessions.map((session) => (
                  <div key={session.id} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                    <div className="mb-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-sm font-mono text-slate-600">Session ID: {session.id.substring(0, 16)}...</p>
                          <p className="text-sm text-slate-600 mt-1">
                            <span className="font-medium">Matter:</span> {session.matter_id.substring(0, 8)}...
                          </p>
                        </div>
                        <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold">
                          Pending
                        </span>
                      </div>

                      <div className="bg-slate-50 rounded p-4 mb-4">
                        <p className="text-xs font-semibold text-slate-600 uppercase mb-2">Query</p>
                        <p className="text-sm text-slate-700 font-mono">{session.query_type || 'N/A'}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-xs font-semibold text-slate-600 uppercase mb-1">Output Hash</p>
                          <p className="text-sm font-mono text-slate-700">{session.output_hash.substring(0, 24)}...</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-600 uppercase mb-1">Created</p>
                          <p className="text-sm text-slate-700">
                            {new Date(session.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleReview(session.id, 'approved')}
                        disabled={reviewingId !== null}
                        className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {reviewingId === session.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4" />
                        )}
                        Approve
                      </button>
                      <button
                        onClick={() => handleReview(session.id, 'rejected')}
                        disabled={reviewingId !== null}
                        className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {reviewingId === session.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <XCircle className="w-4 h-4" />
                        )}
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
