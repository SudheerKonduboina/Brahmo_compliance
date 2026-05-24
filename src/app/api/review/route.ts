import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';
import { recordSessionReview } from '@/lib/audit-trail';



/**
 * POST /api/review
 * Record a review of an AI session
 * Only partners can review sessions
 * 
 * PRODUCTION AUTHENTICATION:
 * This endpoint should:
 * 1. Use the real authenticated user from Supabase Auth
 * 2. Verify the reviewer has 'partner' role
 * 3. Use service role for backend operations (already done with recordSessionReview)
 */

export async function POST(request: NextRequest) {

  try {

    const body = await request.json();

    const { session_id, reviewer_id, decision, notes } = body;



    // Input validation

    if (!session_id || typeof session_id !== 'string') {

      return NextResponse.json(

        { error: 'Invalid or missing session_id' },

        { status: 400 }

      );

    }



    if (!reviewer_id || typeof reviewer_id !== 'string') {

      return NextResponse.json(

        { error: 'Invalid or missing reviewer_id' },

        { status: 400 }

      );

    }



    if (!decision || typeof decision !== 'string') {

      return NextResponse.json(

        { error: 'Invalid or missing decision' },

        { status: 400 }

      );

    }



    if (!['approved', 'rejected'].includes(decision)) {

      return NextResponse.json(

        { error: 'Invalid decision. Use approved or rejected.' },

        { status: 400 }

      );

    }



    // UUID format validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(session_id) || !uuidRegex.test(reviewer_id)) {
      return NextResponse.json(
        { error: 'Invalid UUID format' },
        { status: 400 }
      );
    }

    // Notes validation (optional but should be string if provided)
    if (notes !== undefined && typeof notes !== 'string') {
      return NextResponse.json(
        { error: 'Invalid notes format' },
        { status: 400 }
      );
    }

    // Verify reviewer is a partner
    const { data: reviewerData, error: reviewerError } = await supabaseServer
      .from('users')
      .select('role')
      .eq('id', reviewer_id)
      .single();

    if (reviewerError || !reviewerData) {
      return NextResponse.json(
        { error: 'Reviewer not found' },
        { status: 401 }
      );
    }

    if (reviewerData.role !== 'partner') {
      return NextResponse.json(
        { error: 'Only partners can review sessions' },
        { status: 403 }
      );
    }



    // Record the review

    const success = await recordSessionReview(

      session_id,

      reviewer_id,

      decision as 'approved' | 'rejected',

      notes || ''

    );



    if (!success) {

      return NextResponse.json(

        { error: 'Failed to record review' },

        { status: 500 }

      );

    }



    return NextResponse.json(

      {

        success: true,

        session_id: session_id,

        decision: decision,

        timestamp: new Date().toISOString(),

      },

      { status: 200 }

    );

  } catch (error) {

    console.error('Review recording error:', error);



    return NextResponse.json(

      { error: 'Failed to record review' },

      { status: 500 }

    );

  }

}

