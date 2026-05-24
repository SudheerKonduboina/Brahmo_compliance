'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Download, Loader2, AlertCircle } from 'lucide-react';

export function ComplianceExportPanel() {
  const { session } = useAuth();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleExport = async () => {
    if (!startDate || !endDate) {
      setError('Please select both start and end dates');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setError('Start date must be before end date');
      return;
    }

    setIsExporting(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/export', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Export failed');
      }

      // Download the CSV file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `compliance-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setSuccess(true);
      setStartDate('');
      setEndDate('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Export card */}
      <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900 mb-6">Generate Compliance Report</h3>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Success message */}
        {success && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-3">
            <Download className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-emerald-800">Export successful</p>
              <p className="text-sm text-emerald-700">Your compliance report has been downloaded.</p>
            </div>
          </div>
        )}

        {/* Date range selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <label htmlFor="start-date" className="block text-sm font-medium text-slate-700 mb-2">
              Start Date
            </label>
            <input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={isExporting}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
            />
          </div>
          <div>
            <label htmlFor="end-date" className="block text-sm font-medium text-slate-700 mb-2">
              End Date
            </label>
            <input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              disabled={isExporting}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
            />
          </div>
        </div>

        {/* Export button */}
        <button
          onClick={handleExport}
          disabled={isExporting || !startDate || !endDate}
          className="w-full px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isExporting && <Loader2 className="w-5 h-5 animate-spin" />}
          {isExporting ? 'Generating Report...' : 'Generate & Download Report'}
        </button>
      </div>

      {/* Export info cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h4 className="font-semibold text-slate-900 mb-4">Export Includes</h4>
          <ul className="space-y-2 text-sm text-slate-600">
            <li>✓ All AI sessions in date range</li>
            <li>✓ Review decisions and timestamps</li>
            <li>✓ Blocked access attempts</li>
            <li>✓ Output hashes (not content)</li>
            <li>✓ User roles and identifiers</li>
          </ul>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h4 className="font-semibold text-slate-900 mb-4">Security Features</h4>
          <ul className="space-y-2 text-sm text-slate-600">
            <li>✓ Client names anonymized</li>
            <li>✓ User IDs truncated</li>
            <li>✓ Output content not exported</li>
            <li>✓ Audit trail included</li>
            <li>✓ CSV format (Excel-ready)</li>
          </ul>
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <span className="font-semibold">📋 Regulator-Ready Format:</span> Reports are generated with anonymized data suitable for regulatory submission. All sensitive client information is protected.
        </p>
      </div>
    </div>
  );
}
