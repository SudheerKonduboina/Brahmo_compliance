'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase';
import { AlertCircle, ArrowLeft, FileText } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Matter {
  id: string;
  matter_name: string;
  client_id: string;
  practice_area: string;
  status: string;
  created_at: string;
}

export default function MatterDetailPage() {
  const { session, authInitialized } = useAuth();
  const params = useParams();
  const matterId = typeof params.id === 'string' ? params.id : params.id?.[0] ?? '';
  const router = useRouter();
  const [matter, setMatter] = useState<Matter | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchStartedRef = useRef(false);

  useEffect(() => {
    if (!authInitialized) {
      console.log('[MATTER_DETAIL] Waiting for AuthContext initialization...');
      return;
    }
    if (fetchStartedRef.current) return;
    fetchStartedRef.current = true;

    let mounted = true;

    const fetchMatter = async () => {
      try {
        console.log(`[MATTER_DETAIL] Starting fetch for matterId: ${matterId}`);
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Matter fetch timeout')), 600000);
        });

        // 1. Run access check via API route to log blocked access attempts
        const token = session?.access_token;
        console.log(`[MATTER_DETAIL] Token found in context: ${!!token}`);

        console.log('[MATTER_DETAIL] Fetching /api/access-check...');
        const checkResponse = await fetch('/api/access-check', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ matter_id: matterId })
        });
        console.log(`[MATTER_DETAIL] Access check response status: ${checkResponse.status}`);

        if (!checkResponse.ok) {
          const errorData = await checkResponse.json().catch(() => ({}));
          console.log('[MATTER_DETAIL] Access check returned error:', errorData);
          throw new Error(errorData.error || 'Access check request failed');
        }

        const checkData = await checkResponse.json();
        console.log('[MATTER_DETAIL] Access check returned data:', checkData);
        if (!checkData.allowed) {
          throw new Error('Access denied or matter not found');
        }

        // 2. Fetch the matter details (allowed, so safe to proceed)
        console.log('[MATTER_DETAIL] Fetching matter details from Supabase...');
        const { data, error: fetchError } = await Promise.race([
          supabaseBrowser
            .from('matters')
            .select('id, matter_name, client_id, practice_area, status, created_at')
            .eq('id', matterId)
            .single(),
          timeoutPromise
        ]) as any;

        if (fetchError) throw fetchError;
        console.log('[MATTER_DETAIL] Matter details fetched successfully:', data);

        if (mounted) {
          setMatter(data);
        }
      } catch (err) {
        console.error('[MATTER_DETAIL] Fetch error caught:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Access denied or matter not found');
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    fetchMatter();

    return () => {
      mounted = false;
      fetchStartedRef.current = false;
    };
  }, [matterId, authInitialized, session]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 mb-2 animate-pulse">
            <div className="w-4 h-4 border-2 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
          </div>
          <p className="text-sm text-slate-600">Loading matter details...</p>
        </div>
      </div>
    );
  }

  if (error || !matter) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => router.push('/dashboard/matters')}
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Matters
        </button>
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-red-900 mb-2">🚫 Access Denied</h2>
          <p className="text-sm text-red-800">
            {error || 'You do not have permission to view this matter, or it does not exist.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={() => router.push('/dashboard/matters')}
        className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Matters
      </button>

      {/* Matter header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-blue-50 text-blue-600">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">{matter.matter_name}</h1>
              <p className="text-xs text-slate-500 font-mono mt-1">ID: {matter.id}</p>
            </div>
          </div>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
            {matter.status}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Client</p>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
              Client-{matter.client_id.substring(0, 4)}
            </span>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Practice Area</p>
            <p className="text-sm text-slate-700">{matter.practice_area}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Created</p>
            <p className="text-sm text-slate-700">{new Date(matter.created_at).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* RLS notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-800">
          <span className="font-semibold">Secured by RLS:</span> Matter access is enforced at the database level. Only matters you have explicit permission for are viewable.
        </p>
      </div>
    </div>
  );
}
