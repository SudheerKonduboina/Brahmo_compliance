'use client';

import { useState } from 'react';
import { AISession } from '@/lib/types';

interface ReviewPanelProps {
  sessions: AISession[];
  isLoading: boolean;
  isPartner: boolean;
  onReviewSubmit: (sessionId: string, decision: string, notes: string) => Promise<void>;
}

export function ReviewPanel({
  sessions,
  isLoading,
  isPartner,
  onReviewSubmit,
}: ReviewPanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, { decision: string; notes: string }>>({});

  if (!isPartner) {
    return (
      <div className="p-6 text-center border border-blue-200 rounded-lg bg-blue-50">
        <p className="text-blue-700">
          Review panel is only available to partners.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="p-4 bg-slate-100 rounded-lg animate-pulse h-20" />
        ))}
      </div>
    );
  }

  const pendingSessions = sessions.filter(s => s.review_status === 'pending');

  if (pendingSessions.length === 0) {
    return (
      <div className="p-6 text-center border border-slate-200 rounded-lg bg-slate-50">
        <p className="text-slate-600 font-medium">No pending reviews</p>
        <p className="text-xs text-slate-500 mt-1">All sessions have been reviewed</p>
      </div>
    );
  }

  const handleSubmitReview = async (sessionId: string) => {
    const data = formData[sessionId];
    if (!data || !data.decision) return;

    setSubmittingId(sessionId);
    try {
      await onReviewSubmit(sessionId, data.decision, data.notes);
      setExpandedId(null);
      setFormData((prev) => {
        const updated = { ...prev };
        delete updated[sessionId];
        return updated;
      });
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <div className="space-y-3" role="list" aria-label="Pending review sessions">
      {pendingSessions.map((session) => (
        <div
          key={session.id}
          className="border border-yellow-200 rounded-lg overflow-hidden bg-yellow-50"
          role="listitem"
        >
          <button
            onClick={() => setExpandedId(expandedId === session.id ? null : session.id)}
            className="w-full p-4 flex items-center justify-between hover:bg-yellow-100 transition text-left focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
            aria-expanded={expandedId === session.id}
            aria-controls={`session-panel-${session.id}`}
          >
            <div>
              <p className="text-sm font-medium text-slate-900">
                Session {session.id.substring(0, 8)}
              </p>
              <p className="text-xs text-slate-600 mt-1">
                {session.query_type} • {session.output_token_count || 0} tokens
              </p>
            </div>
            <span className="text-xl" aria-hidden="true">
              {expandedId === session.id ? '▼' : '▶'}
            </span>
          </button>

          {expandedId === session.id && (
            <div id={`session-panel-${session.id}`} className="p-4 border-t border-yellow-200 bg-white">
              <div className="mb-4 p-3 bg-slate-50 rounded text-sm">
                <p className="text-xs font-medium text-slate-600 mb-1">Output Hash:</p>
                <p className="font-mono text-xs text-slate-700 break-all">
                  {session.output_hash}
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-slate-700">Decision</label>
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          [session.id]: {
                            ...(prev[session.id] || { notes: '' }),
                            decision: 'approved',
                          },
                        }))
                      }
                      className={`px-3 py-2 rounded text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                        formData[session.id]?.decision === 'approved'
                          ? 'bg-green-500 text-white'
                          : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                      }`}
                      aria-pressed={formData[session.id]?.decision === 'approved'}
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          [session.id]: {
                            ...(prev[session.id] || { notes: '' }),
                            decision: 'rejected',
                          },
                        }))
                      }
                      className={`px-3 py-2 rounded text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${
                        formData[session.id]?.decision === 'rejected'
                          ? 'bg-red-500 text-white'
                          : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                      }`}
                      aria-pressed={formData[session.id]?.decision === 'rejected'}
                    >
                      ✗ Reject
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor={`notes-${session.id}`} className="text-sm font-medium text-slate-700">Notes</label>
                  <textarea
                    id={`notes-${session.id}`}
                    value={formData[session.id]?.notes || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        [session.id]: {
                          ...(prev[session.id] || { decision: '' }),
                          notes: e.target.value,
                        },
                      }))
                    }
                    placeholder="Add review notes..."
                    className="mt-2 w-full p-2 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    aria-describedby={`notes-hint-${session.id}`}
                  />
                  <span id={`notes-hint-${session.id}`} className="text-xs text-slate-500">
                    Optional review notes for compliance records
                  </span>
                </div>

                <button
                  onClick={() => handleSubmitReview(session.id)}
                  disabled={!formData[session.id]?.decision || submittingId === session.id}
                  className="w-full px-3 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  aria-busy={submittingId === session.id}
                >
                  {submittingId === session.id ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
