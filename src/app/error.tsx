'use client';

import { useEffect } from 'react';

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Error Boundary for App Router
 * Catches errors in child segments and displays graceful error UI
 * 
 * Best practices:
 * - Specific error handling per route
 * - User-friendly error messages
 * - Recovery mechanisms
 * - Logging for debugging
 */
export default function ErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  useEffect(() => {
    // Log error for debugging (in production, send to error tracking service)
    console.error('[BRAHMO Error Boundary]', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        {/* Error Icon */}
        <div className="flex justify-center mb-4">
          <div className="text-6xl">⚠️</div>
        </div>

        {/* Error Title */}
        <h1 className="text-2xl font-bold text-red-900 text-center mb-2">
          Something Went Wrong
        </h1>

        {/* Error Message */}
        <p className="text-center text-red-700 text-sm mb-4">
          {error.message || 'An unexpected error occurred. Please try again.'}
        </p>

        {/* Error Details (Development Only) */}
        {process.env.NODE_ENV === 'development' && (
          <details className="mb-6 p-3 bg-red-100 rounded text-xs text-red-800 max-h-32 overflow-auto">
            <summary className="cursor-pointer font-mono font-bold">
              Error Details
            </summary>
            <pre className="mt-2 whitespace-pre-wrap break-words">
              {error.stack || error.message}
            </pre>
          </details>
        )}

        {/* Recovery Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => reset()}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label="Try again"
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="flex-1 px-4 py-2 bg-slate-200 text-slate-800 rounded-lg font-medium hover:bg-slate-300 transition focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
            aria-label="Go to home page"
          >
            Home
          </button>
        </div>

        {/* Support Information */}
        {process.env.NODE_ENV !== 'development' && (
          <p className="text-center text-xs text-slate-500 mt-4">
            {error.digest && <code>Error ID: {error.digest}</code>}
            {!error.digest && 'Please contact support if this persists.'}
          </p>
        )}
      </div>
    </div>
  );
}
