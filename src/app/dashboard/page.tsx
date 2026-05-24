'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabaseBrowser } from '@/lib/supabase';
import { DashboardNav } from '@/components/dashboard/DashboardNav';
import { MetricsOverview } from '@/components/dashboard/MetricsOverview';
import { MattersPanel } from '@/components/dashboard/MattersPanel';
import { SessionsPanel } from '@/components/dashboard/SessionsPanel';
import { BlockedAccessPanel } from '@/components/dashboard/BlockedAccessPanel';
import { ReviewQueuePanel } from '@/components/dashboard/ReviewQueuePanel';
import { ComplianceExportPanel } from '@/components/dashboard/ComplianceExportPanel';
import { AuditTrailPanel } from '@/components/dashboard/AuditTrailPanel';

type TabType = 'overview' | 'matters' | 'sessions' | 'blocked' | 'reviews' | 'export' | 'audit';

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [stats, setStats] = useState({
    totalSessions: 0,
    reviewed: 0,
    pending: 0,
    blockedEvents: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const fetchStartedRef = useRef(false);
  const renderCountRef = useRef(0);
  const isPartner = profile?.role === 'partner' || user?.app_metadata?.role === 'partner';

  renderCountRef.current++;
  console.log(`[DASHBOARD_PAGE] Render #${renderCountRef.current}, activeTab=${activeTab}, user=${user ? 'exists' : 'null'}`);

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

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <DashboardNav profile={profile} />

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading indicator for stats only */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 mb-2 animate-pulse">
                <div className="w-4 h-4 border-2 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
              </div>
              <p className="text-sm text-slate-600">Loading stats...</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-8 border-b border-slate-200 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'matters', label: 'Matters', icon: '📋' },
            { id: 'sessions', label: 'AI Sessions', icon: '🤖' },
            ...(isPartner ? [
              { id: 'blocked', label: 'Blocked Access', icon: '🚫' },
              { id: 'reviews', label: 'Review Queue', icon: '✓' },
              { id: 'export', label: 'Export', icon: '📥' },
              { id: 'audit', label: 'Audit Trail', icon: '🕐' }
            ] : []),
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`px-4 py-3 border-b-2 font-medium text-sm whitespace-nowrap transition ${
                activeTab === tab.id
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content panels */}
        {activeTab === 'overview' && (
          <MetricsOverview stats={stats} />
        )}
        {activeTab === 'matters' && (
          <MattersPanel />
        )}
        {activeTab === 'sessions' && (
          <SessionsPanel />
        )}
        {activeTab === 'blocked' && isPartner && (
          <BlockedAccessPanel />
        )}
        {activeTab === 'reviews' && isPartner && (
          <ReviewQueuePanel />
        )}
        {activeTab === 'export' && isPartner && (
          <ComplianceExportPanel />
        )}
        {activeTab === 'audit' && isPartner && (
          <AuditTrailPanel />
        )}
      </main>
    </div>
  );
}
