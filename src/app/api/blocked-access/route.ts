import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/blocked-access
 * Retrieve blocked access logs with joined user and matter names.
 * Gated to partners only.
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated (missing token)' },
        { status: 401 }
      );
    }

    // Get authenticated user from Supabase Auth
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
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
        { error: 'Access denied. Partners only.' },
        { status: 403 }
      );
    }

    // Fetch blocked logs using service role client to bypass users table RLS restrictions
    const { data: logs, error: logsError } = await supabaseServer
      .from('blocked_access_log')
      .select('event_id, user_id, attempted_matter_id, reason, created_at, users (name), matters (matter_name)')
      .order('created_at', { ascending: false })
      .limit(50);

    if (logsError) {
      console.error('[API_BLOCKED_ACCESS] Database error:', logsError);
      return NextResponse.json(
        { error: 'Failed to retrieve logs' },
        { status: 500 }
      );
    }

    return NextResponse.json(logs || [], { status: 200 });
  } catch (error) {
    console.error('[API_BLOCKED_ACCESS] Exception:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}
