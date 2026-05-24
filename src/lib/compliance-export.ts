import { supabaseServer } from './supabase';
import { anonymizeClientName } from './hash-chain';
import { ComplianceExportRow } from './types';

/**
 * Generate compliance export data
 * Includes sessions, reviews, and blocked events
 * Client names are anonymized for privacy
 */
export const generateComplianceExport = async (): Promise<ComplianceExportRow[]> => {
  try {
    // Use service role to fetch all data (required for full export)
    const { data: sessions, error: sessionsError } = await supabaseServer
      .from('ai_sessions')
      .select(`
        id,
        session_start,
        session_end,
        query_type,
        output_hash,
        review_status,
        review_decision,
        output_token_count,
        users:user_id(name, role),
        reviewers:reviewer_id(name),
        matters:matter_id(matter_name, practice_area, client_id, clients:client_id(id, name))
      `)
      .order('session_start', { ascending: false });

    if (sessionsError) {
      console.error('Error fetching sessions for export:', sessionsError);
      return [];
    }

    // Fetch blocked events
    const { data: blockedEvents, error: blockedError } = await supabaseServer
      .from('blocked_access_log')
      .select('attempted_matter_id, timestamp')
      .order('timestamp', { ascending: false });

    if (blockedError) {
      console.error('Error fetching blocked events for export:', blockedError);
    }

    // Build client anonymization map
    const clientMap: Record<string, string> = {};
    let clientIndex = 0;

    // Build export rows
    const rows: ComplianceExportRow[] = [];

    if (sessions) {
      for (const session of sessions) {
        const matterData = session.matters as {
          id?: string;
          matter_name?: string;
          practice_area?: string;
          clients?: { id: string };
        } | null;
        const client = matterData?.clients;
        const clientId = client?.id || 'unknown';

        // Create anonymized client name
        if (!clientMap[clientId]) {
          clientMap[clientId] = anonymizeClientName(clientId, clientIndex++);
        }

        const blockedCount = (blockedEvents || []).filter(
          (be: { attempted_matter_id: string }) => be.attempted_matter_id === (matterData?.id || '')
        ).length;

        rows.push({
          date: new Date(session.session_start).toLocaleDateString(),
          user: (session.users as { name?: string })?.name || 'Unknown',
          role: (session.users as { role?: string })?.role || 'unknown',
          matter_type: matterData?.matter_name || 'Unknown',
          practice_area: matterData?.practice_area || 'Unknown',
          query_type: session.query_type || 'N/A',
          output_hash: session.output_hash || 'N/A',
          review_status: session.review_status || 'pending',
          reviewer: (session.reviewers as { name?: string })?.name || 'Pending',
          review_date: session.session_end
            ? new Date(session.session_end).toLocaleDateString()
            : 'Pending',
          decision: session.review_decision || 'Pending',
          blocked_events: blockedCount,
        });
      }
    }

    return rows;
  } catch (err) {
    console.error('Generate compliance export error:', err);
    return [];
  }
};

/**
 * Convert export rows to CSV format
 */
export const rowsToCSV = (rows: ComplianceExportRow[]): string => {
  if (rows.length === 0) {
    return '';
  }

  // CSV headers
  const headers = [
    'Date',
    'User',
    'Role',
    'Matter Type',
    'Practice Area',
    'Query Type',
    'Output Hash',
    'Review Status',
    'Reviewer',
    'Review Date',
    'Decision',
    'Blocked Events',
  ];

  // Build CSV rows
  const csvRows = rows.map((row) => [
    escapeCSVField(row.date),
    escapeCSVField(row.user),
    escapeCSVField(row.role),
    escapeCSVField(row.matter_type),
    escapeCSVField(row.query_type || 'N/A'),
    escapeCSVField(row.output_hash || 'N/A'),
    escapeCSVField(row.review_status),
    escapeCSVField(row.reviewer || 'N/A'),
    escapeCSVField(row.review_date || 'N/A'),
    escapeCSVField(row.decision || 'N/A'),
    escapeCSVField(String(row.blocked_events)),
  ]);

  // Combine headers and rows
  const csv = [
    headers.join(','),
    ...csvRows.map((row) => row.join(',')),
  ].join('\n');

  return csv;
};

/**
 * Escape special characters in CSV fields
 */
const escapeCSVField = (field: string): string => {
  const str = String(field);

  // If field contains comma, newline, or quote, wrap in quotes and escape quotes
  if (str.includes(',') || str.includes('\n') || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
};

/**
 * Generate CSV blob for download
 */
export const generateCSVBlob = (csv: string): Blob => {
  return new Blob([csv], { type: 'text/csv;charset=utf-8;' });
};

/**
 * Create download link for CSV file
 */
export const downloadComplianceCSV = (blob: Blob, filename: string = 'compliance-export.csv') => {
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
