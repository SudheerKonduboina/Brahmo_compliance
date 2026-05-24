'use client';

import { useState } from 'react';
import { downloadComplianceCSV, generateCSVBlob } from '@/lib/compliance-export';

interface ExportButtonProps {
  isPartner: boolean;
}

export function ExportButton({ isPartner }: ExportButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch CSV from API
      const response = await fetch('/api/export');

      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Get CSV data
      const csv = await response.text();

      // Generate blob and download
      const blob = generateCSVBlob(csv);
      const timestamp = new Date().toISOString().split('T')[0];
      downloadComplianceCSV(blob, `brahmo-compliance-${timestamp}.csv`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export error');
      console.error('Export error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isPartner) {
    return (
      <button
        disabled
        className="px-4 py-2 bg-slate-300 text-slate-600 rounded-lg font-medium text-sm cursor-not-allowed"
        title="Only partners can export compliance data"
        aria-label="Export compliance data - partners only"
      >
        📊 Export (Partners Only)
      </button>
    );
  }

  return (
    <div>
      <button
        onClick={handleExport}
        disabled={isLoading}
        className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium text-sm hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
        aria-label={isLoading ? 'Exporting compliance data' : 'Export compliance CSV'}
        aria-busy={isLoading}
      >
        {isLoading ? '⏳ Exporting...' : '📊 Export Compliance CSV'}
      </button>
      {error && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}
