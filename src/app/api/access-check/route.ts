import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';
import { checkMatterAccess, logBlockedAccess } from '@/lib/ethical-wall';

/**
 * POST /api/access-check
 * Check if user can access a matter
 * Returns RLS-enforced result (empty if denied)
 * 
 * PRODUCTION AUTHENTICATION:
 * This endpoint now uses the real authenticated user from Supabase.
 * In a browser-based scenario, use supabaseBrowser directly.
 * For backend-to-backend: extract JWT from Authorization header.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { matter_id } = body;

    // Get authenticated user from Supabase Auth
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const userId = user.id;

    // Input validation
    if (!matter_id || typeof matter_id !== 'string') {
      return NextResponse.json(
        { error: 'Invalid or missing matter_id' },
        { status: 400 }
      );
    }

    // UUID format validation (basic check)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(matter_id)) {
      return NextResponse.json(
        { error: 'Invalid UUID format' },
        { status: 400 }
      );
    }

    // Verify user exists in the system
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

    // Check if user can access matter (RLS enforced)
    const result = await checkMatterAccess(userId, matter_id);

    if (!result.allowed) {
      // Log the blocked access attempt (immutable, tamper-proof)
      await logBlockedAccess(
        userId,
        matter_id,
        'no_permission',
        'API access check denied - user not found in matter_permissions'
      );

      // Return empty result (no information leakage)
      return NextResponse.json(
        {
          allowed: false,
          matters: [],
        },
        { status: 200 }
      );
    }

    // Access allowed
    return NextResponse.json(
      {
        allowed: true,
        matter_id: matter_id,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Access check error:', error);
    
    // Return generic error (no implementation details)
    return NextResponse.json(
      { error: 'Access check failed' },
      { status: 500 }
    );
  }
}
