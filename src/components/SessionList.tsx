'use client';

import { AISession } from '@/lib/types';

interface SessionListProps {
  sessions: AISession[];
  isLoading: boolean;
}

export function SessionList({ sessions, isLoading }: SessionListProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="p-4 bg-slate-100 rounded-lg animate-pulse h-16" />
        ))}
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="p-6 text-center border border-slate-200 rounded-lg bg-slate-50">
        <p className="text-slate-600 font-medium">No accessible sessions</p>
        <p className="text-xs text-slate-500 mt-1">Sessions will appear here once AI queries are made</p>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      reviewed: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  const getDecisionBadge = (decision: string | null) => {
    if (!decision) return null;
    const colors: Record<string, string> = {
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return colors[decision] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-2" role="list" aria-label="AI sessions">
      {sessions.map((session) => (
        <div
          key={session.id}
          className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
          role="listitem"
          tabIndex={0}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-slate-900">
                  Session {session.id.substring(0, 8)}
                </p>
                <span className={`text-xs px-2 py-1 rounded ${getStatusBadge(session.review_status)}`} aria-label={`Status: ${session.review_status}`}>
                  {session.review_status}
                </span>
                {session.review_decision && (
                  <span className={`text-xs px-2 py-1 rounded ${getDecisionBadge(session.review_decision)}`} aria-label={`Decision: ${session.review_decision}`}>
                    {session.review_decision}
                  </span>
                )}
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-600">
                <div>
                  <span className="font-medium">Query Type:</span> {session.query_type || 'N/A'}
                </div>
                <div>
                  <span className="font-medium">Tokens:</span> {session.output_token_count || 0}
                </div>
              </div>
              <div className="mt-2 text-xs text-slate-500 font-mono">
                Hash: {session.output_hash?.substring(0, 16)}...
              </div>
              {session.review_notes && (
                <div className="mt-2 p-2 bg-slate-50 rounded text-xs text-slate-700">
                  <span className="font-medium">Notes:</span> {session.review_notes}
                </div>
              )}
            </div>
            <div className="ml-4 text-right text-xs text-slate-500">
              {new Date(session.session_start).toLocaleDateString()}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
