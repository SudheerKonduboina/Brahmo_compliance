'use client';

import { useState, useEffect, useCallback } from 'react';
import { BlockedAccessEvent } from '@/lib/types';
import { verifyHashChain } from '@/lib/hash-chain';

interface HashChainVerificationProps {
  events: BlockedAccessEvent[];
}

export function HashChainVerification({ events }: HashChainVerificationProps) {
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedAt, setVerifiedAt] = useState<string | null>(null);

  const verifyChain = useCallback(async () => {
    setIsVerifying(true);
    // Simulate async verification for UI feedback
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const valid = await verifyHashChain(events);
    setIsValid(valid);
    setVerifiedAt(new Date().toLocaleString());
    setIsVerifying(false);
  }, [events]);

  useEffect(() => {
    if (events.length > 0) {
      verifyChain();
    }
  }, [events, verifyChain]);

  if (events.length === 0) {
    return (
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🔒</span>
          <div>
            <p className="text-sm font-medium text-slate-900">Hash Chain Verification</p>
            <p className="text-xs text-slate-600">No blocked events to verify</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 border-2 rounded-lg transition-all duration-300" role="region" aria-label="Hash chain verification status">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl" aria-hidden="true">
            {isValid === null ? '⏳' : isValid ? '✅' : '⚠️'}
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Audit Chain Verification
            </p>
            <p className="text-xs text-slate-600">
              {events.length} blocked access event{events.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <button
          onClick={verifyChain}
          disabled={isVerifying}
          className="px-3 py-1.5 text-xs font-medium rounded border transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Re-verify hash chain"
        >
          {isVerifying ? 'Verifying...' : 'Re-verify'}
        </button>
      </div>

      <div
        className={`p-3 rounded-md border ${
          isValid === null
            ? 'bg-slate-50 border-slate-200'
            : isValid
            ? 'bg-green-50 border-green-200'
            : 'bg-red-50 border-red-200'
        }`}
        role="status"
        aria-live="polite"
      >
        {isValid === null ? (
          <p className="text-sm text-slate-700">Verifying hash chain integrity...</p>
        ) : isValid ? (
          <div className="flex items-center gap-2">
            <span className="text-green-700 font-semibold" aria-hidden="true">✓</span>
            <p className="text-sm text-green-800 font-medium">
              Audit chain valid - no tampering detected
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-red-700 font-semibold" aria-hidden="true">⚠</span>
            <p className="text-sm text-red-800 font-medium">
              Tampering detected - hash chain broken
            </p>
          </div>
        )}
      </div>

      {verifiedAt && (
        <p className="text-xs text-slate-500 mt-2">
          Last verified: {verifiedAt}
        </p>
      )}

      <div className="mt-3 pt-3 border-t border-slate-200">
        <p className="text-xs text-slate-600 mb-2 font-medium">Chain Details:</p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-slate-50 p-2 rounded">
            <span className="text-slate-500">Total Events:</span>
            <span className="ml-2 font-mono text-slate-900">{events.length}</span>
          </div>
          <div className="bg-slate-50 p-2 rounded">
            <span className="text-slate-500">Latest Hash:</span>
            <span className="ml-2 font-mono text-slate-900 text-xs">
              {events[events.length - 1]?.current_hash.substring(0, 12)}...
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
