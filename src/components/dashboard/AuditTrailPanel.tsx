'use client';

import { useEffect, useState, useRef } from 'react';
import { supabaseBrowser } from '@/lib/supabase';
import { AlertCircle, Clock, CheckCircle2, XCircle, LogIn, LogOut } from 'lucide-react';

interface AuditEvent {
  id: string;
  type: 'session_start' | 'session_end' | 'review_decision' | 'blocked_access' | 'login' | 'logout';
  user_id: string;
  matter_id?: string;
  details: string;
  created_at: string;
}

interface SessionData {
  id: string;
  user_id: string;
  matter_id: string;
  created_at: string;
  session_end: string | null;
  review_status: string;
}

interface BlockedData {
  event_id: string;
  user_id: string;
  attempted_matter_id: string;
  created_at: string;
}

export function AuditTrailPanel() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const fetchStartedRef = useRef(false);
  const renderCountRef = useRef(0);

  renderCountRef.current++;
  console.log(`[AUDIT_TRAIL_PANEL] Render #${renderCountRef.current}, isLoading=${isLoading}, events.length=${events.length}`);

  useEffect(() => {
    if (fetchStartedRef.current) {
      console.log('[AUDIT_TRAIL_PANEL] Fetch already started, skipping');
      return;
    }
    fetchStartedRef.current = true;

    console.log('[AUDIT_TRAIL_PANEL] Fetch started');
    let mounted = true;

    const fetchAuditEvents = async () => {
      try {
        // Timeout protection
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Audit trail fetch timeout')), 10000);
        });

        // Fetch sequentially to avoid Promise.all deadlock
        const sessionPromise = Promise.race([
          supabaseBrowser
            .from('ai_sessions')
            .select('id, user_id, matter_id, created_at, session_end, review_status')
            .order('created_at', { ascending: false })
            .limit(50),
          timeoutPromise
        ]) as any;

        const sessionData = await sessionPromise;

        const blockedPromise = Promise.race([
          supabaseBrowser
            .from('blocked_access_log')
            .select('event_id, user_id, attempted_matter_id, created_at')
            .order('created_at', { ascending: false })
            .limit(20),
          timeoutPromise
        ]) as any;

        const blockedData = await blockedPromise;

        const combinedEvents: AuditEvent[] = [];

        // Add session events
        if (sessionData.data) {
          sessionData.data.forEach((session: SessionData) => {
            combinedEvents.push({
              id: `session_start_${session.id}`,
              type: 'session_start',
              user_id: session.user_id,
              matter_id: session.matter_id,
              details: `AI session started on matter ${session.matter_id.substring(0, 8)}...`,
              created_at: session.created_at,
            });

            if (session.session_end) {
              combinedEvents.push({
                id: `session_end_${session.id}`,
                type: 'session_end',
                user_id: session.user_id,
                matter_id: session.matter_id,
                details: `AI session ended (${session.review_status})`,
                created_at: session.session_end,
              });
            }
          });
        }

        // Add blocked access events
        if (blockedData.data) {
          blockedData.data.forEach((blocked: BlockedData) => {
            combinedEvents.push({
              id: `blocked_${blocked.event_id}`,
              type: 'blocked_access',
              user_id: blocked.user_id,
              matter_id: blocked.attempted_matter_id,
              details: `Blocked access attempt on matter ${blocked.attempted_matter_id.substring(0, 8)}...`,
              created_at: blocked.created_at,
            });
          });
        }

        // Sort by date descending
        combinedEvents.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        if (mounted) {
          console.log('[AUDIT_TRAIL_PANEL] Fetch completed, events length:', combinedEvents.length);
          setEvents(combinedEvents.slice(0, 100));
        }
      } catch (err) {
        console.error('[AUDIT_TRAIL_PANEL] Fetch error:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch audit trail');
        }
      } finally {
        if (mounted) {
          console.log('[AUDIT_TRAIL_PANEL] Setting loading false');
          setIsLoading(false);
        }
      }
    };

    fetchAuditEvents();

    return () => {
      console.log('[AUDIT_TRAIL_PANEL] Cleanup');
      mounted = false;
      fetchStartedRef.current = false;
      mountedRef.current = false;
    };
  }, []);

  const getEventIcon = (type: AuditEvent['type']) => {
    switch (type) {
      case 'session_start':
      case 'login':
        return <LogIn className="w-5 h-5 text-blue-600" />;
      case 'session_end':
      case 'logout':
        return <LogOut className="w-5 h-5 text-slate-600" />;
      case 'review_decision':
        return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
      case 'blocked_access':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-slate-600" />;
    }
  };

  const getEventColor = (type: AuditEvent['type']) => {
    switch (type) {
      case 'session_start':
      case 'login':
        return 'bg-blue-50 border-blue-200';
      case 'session_end':
      case 'logout':
        return 'bg-slate-50 border-slate-200';
      case 'review_decision':
        return 'bg-emerald-50 border-emerald-200';
      case 'blocked_access':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-slate-50 border-slate-200';
    }
  };

  return (
    <div className="space-y-4">
      {/* Inline loading indicator */}
      {isLoading && (
        <div className="flex items-center justify-center py-4">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 mb-2 animate-pulse">
              <div className="w-3 h-3 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin" />
            </div>
            <p className="text-xs text-slate-600">Loading audit trail...</p>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900 mb-1">Error Loading Audit Trail</h3>
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && events.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600 font-medium mb-1">No Audit Events</p>
          <p className="text-sm text-slate-500">
            Audit trail events will appear here as sessions are created and reviewed.
          </p>
        </div>
      )}

      {/* Content */}
      {!isLoading && !error && events.length > 0 && (
        <div>
          {/* Timeline */}
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-200" />

            {/* Timeline events */}
            <div className="space-y-4">
              {events.map((event) => (
                <div key={event.id} className="relative pl-20">
                  {/* Timeline dot */}
                  <div className="absolute left-1 top-2 w-12 h-12 rounded-full border-2 border-white bg-white flex items-center justify-center -ml-6">
                    {getEventIcon(event.type)}
                  </div>

                  {/* Event card */}
                  <div className={`border rounded-lg p-4 ${getEventColor(event.type)}`}>
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-slate-900">
                        {event.type === 'session_start' && '🤖 AI Session Started'}
                        {event.type === 'session_end' && '✓ AI Session Completed'}
                        {event.type === 'review_decision' && '📋 Session Reviewed'}
                        {event.type === 'blocked_access' && '🚫 Access Blocked'}
                        {event.type === 'login' && '🔓 User Logged In'}
                        {event.type === 'logout' && '🔒 User Logged Out'}
                      </h4>
                      <span className="text-xs text-slate-500 whitespace-nowrap ml-4">
                        {new Date(event.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700">{event.details}</p>
                    <p className="text-xs text-slate-600 font-mono mt-2">
                      User: {event.user_id.substring(0, 12)}...
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Info footer */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mt-8">
        <p className="text-xs text-slate-600">
          <span className="font-semibold">🕐 CHRONOLOGICAL AUDIT TRAIL:</span> Complete forensic timeline of all system events. This immutable log is maintained at PostgreSQL level and cannot be modified by application code.
        </p>
      </div>
    </div>
  );
}
