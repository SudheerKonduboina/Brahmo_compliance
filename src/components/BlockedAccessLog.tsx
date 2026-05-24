'use client';

import { BlockedAccessEvent } from '@/lib/types';

interface BlockedAccessLogProps {
  events: BlockedAccessEvent[];
  isLoading: boolean;
}

export function BlockedAccessLog({ events, isLoading }: BlockedAccessLogProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="p-4 bg-slate-100 rounded-lg animate-pulse h-16" />
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="p-6 text-center border border-green-200 rounded-lg bg-green-50">
        <p className="text-green-700 font-medium">✓ No blocked access events</p>
        <p className="text-xs text-green-600 mt-1">All access attempts have been authorized</p>
      </div>
    );
  }

  return (
    <div className="space-y-2" role="list" aria-label="Blocked access events">
      {events.map((event) => (
        <div
          key={event.event_id}
          className="p-4 border-l-4 border-red-500 bg-red-50 rounded-lg"
          role="listitem"
          tabIndex={0}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="inline-block px-2 py-1 bg-red-200 text-red-800 text-xs rounded font-medium" aria-label="Access blocked">
                  BLOCKED
                </span>
                <span className="inline-block px-2 py-1 bg-slate-200 text-slate-800 text-xs rounded">
                  {event.reason.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-700">
                <div>
                  <span className="font-medium">Event:</span> {event.event_id.substring(0, 8)}
                </div>
                <div>
                  <span className="font-medium">Time:</span>{' '}
                  {new Date(event.timestamp).toLocaleString()}
                </div>
              </div>
              {event.details && (
                <div className="mt-2 p-2 bg-red-100 rounded text-xs text-slate-700">
                  {event.details}
                </div>
              )}
              <div className="mt-2 text-xs font-mono text-slate-600 space-y-1">
                <div>Hash: {event.current_hash.substring(0, 20)}...</div>
                {event.previous_hash && (
                  <div>Chain: {event.previous_hash.substring(0, 20)}... → {event.current_hash.substring(0, 20)}...</div>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
