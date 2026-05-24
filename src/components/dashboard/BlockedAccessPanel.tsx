'use client';

import { useEffect, useState, useRef } from 'react';
import { supabaseBrowser } from '@/lib/supabase';
import { AlertCircle, Shield } from 'lucide-react';

interface BlockedAccess {
  event_id: string;
  user_id: string;
  attempted_matter_id: string;
  reason: string;
  created_at: string;
}

export function BlockedAccessPanel() {
  const [blockedAccess, setBlockedAccess] = useState<BlockedAccess[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const fetchStartedRef = useRef(false);
  const renderCountRef = useRef(0);

  renderCountRef.current++;
  console.log(`[BLOCKED_ACCESS_PANEL] Render #${renderCountRef.current}, isLoading=${isLoading}, blockedAccess.length=${blockedAccess.length}`);

  useEffect(() => {
    if (fetchStartedRef.current) {
      console.log('[BLOCKED_ACCESS_PANEL] Fetch already started, skipping');
      return;
    }
    fetchStartedRef.current = true;

    console.log('[BLOCKED_ACCESS_PANEL] Fetch started');
    let mounted = true;

    const fetchBlockedAccess = async () => {
      try {
        // Timeout protection
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Blocked access fetch timeout')), 8000);
        });

        const { data, error: fetchError } = await Promise.race([
          supabaseBrowser
            .from('blocked_access_log')
            .select('event_id, user_id, attempted_matter_id, reason, created_at')
            .order('created_at', { ascending: false })
            .limit(50),
          timeoutPromise
        ]) as any;

        if (fetchError) throw fetchError;

        if (mounted) {
          console.log('[BLOCKED_ACCESS_PANEL] Fetch completed, data length:', data?.length || 0);
          setBlockedAccess(data || []);
        }
      } catch (err) {
        console.error('[BLOCKED_ACCESS_PANEL] Fetch error:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch blocked access logs');
        }
      } finally {
        if (mounted) {
          console.log('[BLOCKED_ACCESS_PANEL] Setting loading false');
          setIsLoading(false);
        }
      }
    };

    fetchBlockedAccess();

    return () => {
      console.log('[BLOCKED_ACCESS_PANEL] Cleanup');
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
            <p className="text-xs text-slate-600">Loading blocked access logs...</p>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900 mb-1">Error Loading Logs</h3>
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && blockedAccess.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Shield className="w-12 h-12 text-emerald-300 mx-auto mb-4" />
          <p className="text-slate-600 font-medium mb-1">No Blocked Access Events</p>
          <p className="text-sm text-slate-500">
            No unauthorized access attempts have been recorded. Ethical walls are operating normally.
          </p>
        </div>
      )}

      {/* Content */}
      {!isLoading && !error && blockedAccess.length > 0 && (
        <div>
          {/* Severity indicator */}
          {(() => {
            const getSeverity = () => {
              if (blockedAccess.length >= 5) return { level: 'Critical', color: 'bg-red-50 border-red-200 text-red-800' };
              if (blockedAccess.length >= 3) return { level: 'Warning', color: 'bg-amber-50 border-amber-200 text-amber-800' };
              return { level: 'Info', color: 'bg-blue-50 border-blue-200 text-blue-800' };
            };
            const severity = getSeverity();
            return (
              <div className={`border rounded-lg p-4 flex items-start gap-3 ${severity.color}`}>
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold mb-1">
                    Severity Level: {severity.level} ({blockedAccess.length} events)
                  </p>
                  <p className="text-sm opacity-90">
                    {blockedAccess.length >= 5 && 'Critical: Multiple unauthorized access attempts. Escalation recommended.'}
                    {blockedAccess.length >= 3 && blockedAccess.length < 5 && 'Warning: Several unauthorized access attempts detected.'}
                    {blockedAccess.length < 3 && 'Minimal unauthorized access attempts detected.'}
                  </p>
                </div>
              </div>
            );
          })()}

          {/* Blocked access table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Attempted Matter
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Reason
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {blockedAccess.map((event) => (
                    <tr key={event.event_id} className="hover:bg-red-50 transition">
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {new Date(event.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-mono text-slate-600">{event.user_id.substring(0, 8)}...</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-mono text-slate-600">{event.attempted_matter_id.substring(0, 8)}...</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          {event.reason || 'Insufficient permissions'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Immutability notice */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
        <p className="text-xs text-slate-600 font-mono">
          <span className="font-semibold">🔒 APPEND-ONLY LOG:</span> PostgreSQL UPDATE and DELETE policies prohibit modification. All entries are permanently immutable for forensic compliance.
        </p>
      </div>
    </div>
  );
}
