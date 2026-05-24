'use client';

import { useEffect, useState, useRef } from 'react';
import { supabaseBrowser } from '@/lib/supabase';
import { AlertCircle, FileText } from 'lucide-react';

interface Matter {
  id: string;
  matter_name: string;
  client_id: string;
  practice_area: string;
  status: string;
  created_at: string;
}

export function MattersPanel() {
  const [matters, setMatters] = useState<Matter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const fetchStartedRef = useRef(false);
  const renderCountRef = useRef(0);

  renderCountRef.current++;
  console.log(`[MATTERS_PANEL] Render #${renderCountRef.current}, isLoading=${isLoading}, matters.length=${matters.length}`);

  useEffect(() => {
    if (fetchStartedRef.current) {
      console.log('[MATTERS_PANEL] Fetch already started, skipping');
      return;
    }
    fetchStartedRef.current = true;

    console.log('[MATTERS_PANEL] Fetch started');
    let mounted = true;

    const fetchMatters = async () => {
      try {
        // Timeout protection
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Matters fetch timeout')), 8000);
        });

        const { data, error: fetchError } = await Promise.race([
          supabaseBrowser
            .from('matters')
            .select('id, matter_name, client_id, practice_area, status, created_at'),
          timeoutPromise
        ]) as any;

        if (fetchError) throw fetchError;

        if (mounted) {
          console.log('[MATTERS_PANEL] Fetch completed, data length:', data?.length || 0);
          setMatters(data || []);
        }
      } catch (err) {
        console.error('[MATTERS_PANEL] Fetch error:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch matters');
        }
      } finally {
        if (mounted) {
          console.log('[MATTERS_PANEL] Setting loading false');
          setIsLoading(false);
        }
      }
    };

    fetchMatters();

    return () => {
      console.log('[MATTERS_PANEL] Cleanup');
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
            <p className="text-xs text-slate-600">Loading matters...</p>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900 mb-1">Error Loading Matters</h3>
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && matters.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600 font-medium mb-1">No Accessible Matters</p>
          <p className="text-sm text-slate-500">
            You do not have access to any matters at this time. Contact your administrator if you believe this is an error.
          </p>
        </div>
      )}

      {/* Content */}
      {!isLoading && !error && matters.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Matter
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Practice Area
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {matters.map((matter) => (
                  <tr key={matter.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-slate-900">{matter.matter_name}</p>
                        <p className="text-xs text-slate-500 font-mono mt-1">{matter.id.substring(0, 8)}...</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                        Client-{matter.client_id.substring(0, 4)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{matter.practice_area}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                        {matter.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {new Date(matter.created_at).toLocaleDateString()}
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
          <span className="font-semibold">Secured by RLS:</span> Matter list is filtered by database-level Row-Level Security based on your role and permissions. Only matters you have access to are displayed.
        </p>
      </div>
    </div>
  );
}
