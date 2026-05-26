import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { startAISession, endAISession } from '@/lib/audit-trail';
import { computeOutputHash } from '@/lib/hash-chain';

/**
 * POST /api/sessions
 * Start or end an AI session
 * action: 'start' or 'end'
 * 
 * PRODUCTION AUTHENTICATION:
 * This endpoint verifies the authenticated user from Supabase Auth
 * before allowing session start/end operations.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, matter_id, query_type, session_id, output_content, output_token_count } = body;

    if (!action) {
      return NextResponse.json(
        { error: 'Missing required field: action (start|end)' },
        { status: 400 }
      );
    }

    // Get authenticated user from Supabase Auth
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const userId = user.id;

    if (action === 'start') {
      if (!matter_id || !query_type) {
        return NextResponse.json(
          { error: 'Missing required fields: matter_id, query_type' },
          { status: 400 }
        );
      }

      // Verify user exists in users table
      const { data: userData, error: userError } = await supabaseServer
        .from('users')
        .select('id')
        .eq('id', userId)
        .single();

      if (userError || !userData) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 401 }
        );
      }

      // Start session (RLS will enforce matter access)
      const newSessionId = await startAISession(userId, matter_id, query_type);

      if (!newSessionId) {
        return NextResponse.json(
          { error: 'Failed to start session' },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          session_id: newSessionId,
          timestamp: new Date().toISOString(),
        },
        { status: 201 }
      );
    }

    if (action === 'end') {
      if (!session_id) {
        return NextResponse.json(
          { error: 'Missing required field: session_id' },
          { status: 400 }
        );
      }

      // Compute output hash (never store full output)
      const outputHash = output_content
        ? await computeOutputHash(output_content)
        : '';

      // End session
      const success = await endAISession(
        session_id,
        output_token_count || 0,
        outputHash
      );

      if (!success) {
        return NextResponse.json(
          { error: 'Failed to end session' },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          session_id: session_id,
          output_hash: outputHash,
          timestamp: new Date().toISOString(),
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { error: 'Invalid action. Use start or end.' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Session management error:', error);

    return NextResponse.json(
      { error: 'Session management failed' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/sessions
 * Get accessible sessions (RLS enforced)
 * Uses authenticated user context from Supabase Auth
 */
export async function GET() {
  try {
    // Get authenticated user from Supabase Auth
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Use browser client for RLS-enforced queries
    // RLS policies will automatically filter sessions based on user permissions
    return NextResponse.json(
      {
        message: 'Use browser client for RLS-enforced queries',
        user_id: user.id,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Fetch sessions error:', error);

    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}
