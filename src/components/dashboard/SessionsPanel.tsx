'use client';

import { useEffect, useState, useRef } from 'react';
import { supabaseBrowser } from '@/lib/supabase';
import { AlertCircle, Bot } from 'lucide-react';

interface AiSession {
  id: string;
  user_id: string;
  matter_id: string;
  query_type: string;
  output_hash: string;
  review_status: string;
  created_at: string;
  session_end?: string;
}

export function SessionsPanel() {
  const [sessions, setSessions] = useState<AiSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const fetchStartedRef = useRef(false);
  const renderCountRef = useRef(0);

  renderCountRef.current++;
  console.log(`[SESSIONS_PANEL] Render #${renderCountRef.current}, isLoading=${isLoading}, sessions.length=${sessions.length}`);

  useEffect(() => {
    if (fetchStartedRef.current) {
      console.log('[SESSIONS_PANEL] Fetch already started, skipping');
      return;
    }
    fetchStartedRef.current = true;

    console.log('[SESSIONS_PANEL] Fetch started');
    let mounted = true;

    const fetchSessions = async () => {
      try {
        // Timeout protection
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Sessions fetch timeout')), 8000);
        });

        const { data, error: fetchError } = await Promise.race([
          supabaseBrowser
            .from('ai_sessions')
            .select('id, user_id, matter_id, query_type, output_hash, review_status, created_at, session_end')
            .order('created_at', { ascending: false })
            .limit(20),
          timeoutPromise
        ]) as any;

        if (fetchError) throw fetchError;

        if (mounted) {
          console.log('[SESSIONS_PANEL] Fetch completed, data length:', data?.length || 0);
          setSessions(data || []);
        }
      } catch (err) {
        console.error('[SESSIONS_PANEL] Fetch error:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch sessions');
        }
      } finally {
        if (mounted) {
          console.log('[SESSIONS_PANEL] Setting loading false');
          setIsLoading(false);
        }
      }
    };

    fetchSessions();

    return () => {
      console.log('[SESSIONS_PANEL] Cleanup');
      mounted = false;
      fetchStartedRef.current = false;
      mountedRef.current = false;
    };
  }, []);

  return (
    <div className="space-y-4">
      {/* Inline loading indicator */}
      {isLoading && (
        <div className="flex items-center justify-center py-4">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 mb-2 animate-pulse">
              <div className="w-3 h-3 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin" />
            </div>
            <p className="text-xs text-slate-600">Loading sessions...</p>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900 mb-1">Error Loading Sessions</h3>
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && sessions.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Bot className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600 font-medium mb-1">No AI Sessions</p>
          <p className="text-sm text-slate-500">
            No AI sessions have been recorded yet. Sessions will appear here once created.
          </p>
        </div>
      )}

      {/* Content */}
      {!isLoading && !error && sessions.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Session
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Matter
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Query Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Output Hash
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Started
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {sessions.map((session) => (
                  <tr key={session.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-xs font-mono text-slate-900">{session.id.substring(0, 8)}...</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-600">{session.matter_id.substring(0, 8)}...</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600 truncate max-w-xs">
                        {(session.query_type || 'N/A').substring(0, 50)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        session.review_status === 'reviewed' ? 'bg-emerald-50 text-emerald-700' :
                        session.review_status === 'pending' ? 'bg-amber-50 text-amber-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {session.review_status === 'pending' ? 'Pending' : session.review_status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs font-mono text-slate-600">{session.output_hash.substring(0, 16)}...</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {new Date(session.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-800">
          <span className="font-semibold">Hash Chain Verification:</span> Each session output is hashed and linked to the previous session for immutable audit trail integrity.
        </p>
      </div>
    </div>
  );
}
