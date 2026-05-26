export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { generateComplianceExport, rowsToCSV } from '@/lib/compliance-export';

/**
 * GET /api/export
 * Generate compliance export CSV
 * Only partners can access
 * 
 * PRODUCTION AUTHENTICATION:
 * This endpoint verifies the authenticated user from Supabase Auth
 * and enforces partner-only access based on user role
 */
export async function GET(request: Request) {
  try {
    // Get authenticated user from Supabase Auth
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) { 
      return NextResponse.json({ error: 'Not authenticated (missing token)' }, { status: 401 }); 
    }
    
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated (invalid token)' },
        { status: 401 }
      );
    }

    // Verify user is a partner
    const { data: userData, error: userError } = await supabaseServer
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      );
    }

    if (userData.role !== 'partner') {
      return NextResponse.json(
        { error: 'Only partners can export compliance data' },
        { status: 403 }
      );
    }

    // Generate export data (RLS will enforce data access)
    const rows = await generateComplianceExport();

    if (rows.length === 0) {
      return NextResponse.json(
        { warning: 'No data to export' },
        { status: 200 }
      );
    }

    // Convert to CSV
    const csv = rowsToCSV(rows);

    // Generate response with CSV data
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `brahmo-compliance-export-${timestamp}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv;charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Export generation error:', error);

    return NextResponse.json(
      { error: 'Failed to generate export' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/export
 * Alternative: Get export data as JSON
 * Uses authenticated user context from Supabase Auth
 */
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) { 
      return NextResponse.json({ error: 'Not authenticated (missing token)' }, { status: 401 }); 
    }
    
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated (invalid token)' },
        { status: 401 }
      );
    }

    // Verify user is a partner
    const { data: userData, error: userError } = await supabaseServer
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      );
    }

    if (userData.role !== 'partner') {
      return NextResponse.json(
        { error: 'Only partners can export compliance data' },
        { status: 403 }
      );
    }

    const rows = await generateComplianceExport();

    return NextResponse.json(
      {
        success: true,
        row_count: rows.length,
        rows: rows,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Export generation error:', error);

    return NextResponse.json(
      { error: 'Failed to generate export' },
      { status: 500 }
    );
  }
}
