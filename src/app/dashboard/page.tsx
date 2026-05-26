'use client';

import { useState, useEffect, useRef } from 'react';
import { supabaseBrowser } from '@/lib/supabase';
import { MetricsOverview } from '@/components/dashboard/MetricsOverview';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalSessions: 0,
    reviewed: 0,
    pending: 0,
    blockedEvents: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const fetchStartedRef = useRef(false);
  const renderCountRef = useRef(0);

  renderCountRef.current++;
  console.log(`[DASHBOARD_PAGE] Render #${renderCountRef.current}`);

  useEffect(() => {
    if (fetchStartedRef.current) {
      console.log('[DASHBOARD_PAGE] Stats fetch already started, skipping');
      return;
    }
    fetchStartedRef.current = true;

    console.log('[DASHBOARD_PAGE] Stats fetch started');
    let mounted = true;

    const fetchStats = async () => {
      try {
        console.log('[DASHBOARD] Loading data...');

        // Add timeout protection
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Dashboard fetch timeout')), 10000);
        });

        // Get session stats from RLS-protected view
        console.log('[DASHBOARD] Fetching ai_sessions...');
        const sessionsPromise = supabaseBrowser
          .from('ai_sessions')
          .select('id, review_status');

        const { data: sessions, error: sessionsError } = await Promise.race([
          sessionsPromise,
          timeoutPromise
        ]) as any;

        if (sessionsError) {
          console.error('[DASHBOARD] Sessions fetch error:', sessionsError);
        } else {
          console.log('[DASHBOARD] Sessions fetched:', sessions?.length || 0);
        }

        console.log('[DASHBOARD] Fetching blocked_access_log...');
        const blockedPromise = supabaseBrowser
          .from('blocked_access_log')
          .select('event_id');

        const { data: blockedAccess, error: blockedError } = await Promise.race([
          blockedPromise,
          timeoutPromise
        ]) as any;

        if (blockedError) {
          console.error('[DASHBOARD] Blocked access fetch error:', blockedError);
        } else {
          console.log('[DASHBOARD] Blocked events fetched:', blockedAccess?.length || 0);
        }

        const totalSessions = sessions?.length || 0;
        const reviewed = sessions?.filter((s: { review_status?: string }) => s.review_status === 'reviewed').length || 0;
        const pending = sessions?.filter((s: { review_status?: string }) => s.review_status === 'pending').length || 0;
        const blockedEvents = blockedAccess?.length || 0;

        console.log('[DASHBOARD] Stats calculated:', { totalSessions, reviewed, pending, blockedEvents });

        if (mounted) {
          setStats({
            totalSessions,
            reviewed,
            pending,
            blockedEvents,
          });
        }
      } catch (err) {
        console.error('[DASHBOARD] Initialization failed:', err);
        // Don't block rendering on fetch failure - set safe defaults
        if (mounted) {
          setStats({
            totalSessions: 0,
            reviewed: 0,
            pending: 0,
            blockedEvents: 0,
          });
        }
      } finally {
        console.log('[DASHBOARD] Loading finished');
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    fetchStats();

    return () => {
      console.log('[DASHBOARD_PAGE] Cleanup');
      mounted = false;
      fetchStartedRef.current = false;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 mb-2 animate-pulse">
            <div className="w-4 h-4 border-2 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
          </div>
          <p className="text-sm text-slate-600">Loading stats...</p>
        </div>
      </div>
    );
  }

  return <MetricsOverview stats={stats} />;
}
