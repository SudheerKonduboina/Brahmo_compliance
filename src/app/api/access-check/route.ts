import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { logBlockedAccess } from '@/lib/ethical-wall';

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
  console.log('[API_ACCESS_CHECK] Received request');
  try {
    const body = await request.json();
    const { matter_id } = body;
    console.log(`[API_ACCESS_CHECK] matter_id from request: ${matter_id}`);

    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    console.log(`[API_ACCESS_CHECK] Authorization header token exists: ${!!token}`);

    if (!token) {
      console.log('[API_ACCESS_CHECK] Missing token, returning 401');
      return NextResponse.json(
        { error: 'Not authenticated (missing token)' },
        { status: 401 }
      );
    }

    // Get authenticated user from Supabase Auth
    console.log('[API_ACCESS_CHECK] Authenticating token with Supabase...');
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token);
    console.log(`[API_ACCESS_CHECK] Supabase auth results - user exists: ${!!user}, error:`, authError);

    if (authError || !user) {
      console.log('[API_ACCESS_CHECK] Auth failed, returning 401');
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const userId = user.id;
    console.log(`[API_ACCESS_CHECK] Authenticated userId: ${userId}`);

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

    // Verify user exists and check role
    console.log(`[API_ACCESS_CHECK] Querying user profile for role of userId: ${userId}`);
    const { data: userData, error: userError } = await supabaseServer
      .from('users')
      .select('id, role')
      .eq('id', userId)
      .single();
    console.log(`[API_ACCESS_CHECK] User role query result: role=${userData?.role}, error:`, userError);

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      );
    }

    // Verify matter exists in system
    console.log(`[API_ACCESS_CHECK] Querying matter existence for matterId: ${matter_id}`);
    const { data: matterData, error: matterError } = await supabaseServer
      .from('matters')
      .select('id')
      .eq('id', matter_id)
      .maybeSingle();
    console.log(`[API_ACCESS_CHECK] Matter query result exists: ${!!matterData}, error:`, matterError);

    if (matterError || !matterData) {
      // Log the blocked access attempt (immutable, tamper-proof)
      console.log('[API_ACCESS_CHECK] Matter not found, logging block access event...');
      await logBlockedAccess(
        userId,
        matter_id,
        'matter_not_found',
        'API access check denied - matter not found in database'
      );

      return NextResponse.json(
        {
          allowed: false,
          matters: [],
        },
        { status: 200 }
      );
    }

    // Determine access:
    let allowed = false;

    if (userData.role === 'partner') {
      console.log('[API_ACCESS_CHECK] User is partner, global access granted');
      // Partners have access to all matters
      allowed = true;
    } else {
      console.log(`[API_ACCESS_CHECK] User is associate, querying matter_permissions for matterId: ${matter_id}`);
      // Check if there is an explicit permission record for this user/matter
      const { data: permission, error: permError } = await supabaseServer
        .from('matter_permissions')
        .select('id')
        .eq('user_id', userId)
        .eq('matter_id', matter_id)
        .maybeSingle();
      console.log(`[API_ACCESS_CHECK] Matter permissions query result exists: ${!!permission}, error:`, permError);

      if (!permError && permission) {
        allowed = true;
      }
    }

    if (!allowed) {
      // Log the blocked access attempt (immutable, tamper-proof)
      console.log('[API_ACCESS_CHECK] User is unauthorized, logging blocked access event...');
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

    console.log('[API_ACCESS_CHECK] Access granted successfully');
    // Access allowed
    return NextResponse.json(
      {
        allowed: true,
        matter_id: matter_id,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API_ACCESS_CHECK] Exception caught:', error);
    
    // Return generic error (no implementation details)
    return NextResponse.json(
      { error: 'Access check failed' },
      { status: 500 }
    );
  }
}
