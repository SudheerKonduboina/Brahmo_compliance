import { supabaseBrowser, supabaseServer } from './supabase';
import { AISession } from './types';

/**
 * Start an AI session
 * Records when a user begins querying a matter
 */
export const startAISession = async (
  userId: string,
  matterId: string,
  queryType: string
): Promise<string | null> => {
  try {
    const { data, error } = await supabaseServer
      .from('ai_sessions')
      .insert({
        user_id: userId,
        matter_id: matterId,
        session_start: new Date().toISOString(),
        query_type: queryType,
        review_status: 'pending',
      })
      .select('id')
      .single();

    if (error) {
      console.error('[BRAHMO] Failed to start AI session:', {
        code: error.code,
        message: error.message,
        userId,
        matterId,
      });
      return null;
    }

    return data?.id || null;
  } catch (err) {
    console.error('[BRAHMO] Unexpected error starting session:', err);
    return null;
  }
};

/**
 * End an AI session
 * Records output token count and hash (not full output for privacy)
 */
export const endAISession = async (
  sessionId: string,
  outputTokenCount: number,
  outputHash: string
): Promise<boolean> => {
  try {
    const { error } = await supabaseServer
      .from('ai_sessions')
      .update({
        session_end: new Date().toISOString(),
        output_token_count: outputTokenCount,
        output_hash: outputHash,
      })
      .eq('id', sessionId);

    if (error) {
      console.error('[BRAHMO] Failed to end AI session:', {
        code: error.code,
        message: error.message,
        sessionId,
      });
      return false;
    }

    return true;
  } catch (err) {
    console.error('[BRAHMO] Unexpected error ending session:', err);
    return false;
  }
};

/**
 * Record a review of an AI session
 * Only partners can review
 * Updates review status and decision
 */
export const recordSessionReview = async (
  sessionId: string,
  reviewerId: string,
  decision: 'approved' | 'rejected',
  notes: string
): Promise<boolean> => {
  try {
    const { error } = await supabaseServer
      .from('ai_sessions')
      .update({
        review_status: 'reviewed',
        reviewer_id: reviewerId,
        review_timestamp: new Date().toISOString(),
        review_decision: decision,
        review_notes: notes,
      })
      .eq('id', sessionId);

    if (error) {
      console.error('[BRAHMO] Failed to record session review:', {
        code: error.code,
        message: error.message,
        sessionId,
        reviewerId,
        decision,
      });
      return false;
    }

    return true;
  } catch (err) {
    console.error('[BRAHMO] Unexpected error recording review:', err);
    return false;
  }
};

/**
 * Get all sessions pending review
 * RLS enforces that only partners can see all sessions
 */
export const getPendingReviews = async (): Promise<AISession[]> => {
  try {
    const { data, error } = await supabaseBrowser
      .from('ai_sessions')
      .select(`
        *,
        users:user_id(name, email, role),
        matters:matter_id(matter_name, practice_area, client_id)
      `)
      .eq('review_status', 'pending')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching pending reviews:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Fetch pending reviews error:', err);
    return [];
  }
};

/**
 * Get audit trail for a specific matter
 * Shows all sessions, reviews, and access events
 */
export const getMatterAuditTrail = async (matterId: string) => {
  try {
    // Get sessions for this matter
    const { data: sessions, error: sessionsError } = await supabaseBrowser
      .from('ai_sessions')
      .select(`
        *,
        users:user_id(name, email, role),
        reviewers:reviewer_id(name)
      `)
      .eq('matter_id', matterId)
      .order('created_at', { ascending: false });

    if (sessionsError) {
      console.error('Error fetching sessions for audit trail:', sessionsError);
      return { sessions: [], blockedEvents: [] };
    }

    // Get blocked access events for this matter (if user is partner)
    const { data: blockedEvents, error: blockedError } = await supabaseBrowser
      .from('blocked_access_log')
      .select(`
        *,
        users:user_id(name, email)
      `)
      .eq('attempted_matter_id', matterId)
      .order('timestamp', { ascending: false });

    if (blockedError) {
      console.error('Error fetching blocked events:', blockedError);
      return { sessions: sessions || [], blockedEvents: [] };
    }

    return {
      sessions: sessions || [],
      blockedEvents: blockedEvents || [],
    };
  } catch (err) {
    console.error('Get audit trail error:', err);
    return { sessions: [], blockedEvents: [] };
  }
};

/**
 * Get user's session statistics
 */
export const getUserSessionStats = async (userId: string) => {
  try {
    // Get total sessions
    const { data: allSessions, error: allError } = await supabaseBrowser
      .from('ai_sessions')
      .select('review_status')
      .eq('user_id', userId);

    if (allError) {
      console.error('Error fetching session stats:', allError);
      return {
        total_sessions: 0,
        reviewed_count: 0,
        pending_count: 0,
        approved_count: 0,
        rejected_count: 0,
      };
    }

    const sessions = allSessions || [];
    const reviewedCount = sessions.filter(s => s.review_status === 'reviewed').length;
    const pendingCount = sessions.filter(s => s.review_status === 'pending').length;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const approvedCount = sessions.filter((s) => s.review_status === 'reviewed' && (s as any).review_decision === 'approved').length;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rejectedCount = sessions.filter((s) => s.review_status === 'reviewed' && (s as any).review_decision === 'rejected').length;

    return {
      total_sessions: sessions.length,
      reviewed_count: reviewedCount,
      pending_count: pendingCount,
      approved_count: approvedCount,
      rejected_count: rejectedCount,
    };
  } catch (err) {
    console.error('Get session stats error:', err);
    return {
      total_sessions: 0,
      reviewed_count: 0,
      pending_count: 0,
      approved_count: 0,
      rejected_count: 0,
    };
  }
};

/**
 * Get total system statistics
 */
export const getSystemStats = async () => {
  try {
    // Get total sessions
    const { count: totalSessions } = await supabaseBrowser
      .from('ai_sessions')
      .select('*', { count: 'exact', head: true });

    // Get reviewed sessions
    const { count: reviewedSessions } = await supabaseBrowser
      .from('ai_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('review_status', 'reviewed');

    // Get blocked events
    const { count: blockedEvents } = await supabaseBrowser
      .from('blocked_access_log')
      .select('*', { count: 'exact', head: true });

    // Get pending reviews
    const { count: pendingReviews } = await supabaseBrowser
      .from('ai_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('review_status', 'pending');

    const total = totalSessions || 0;
    const reviewed = reviewedSessions || 0;
    const reviewedPercentage = total > 0 ? Math.round((reviewed / total) * 100) : 0;

    return {
      total_sessions: total,
      reviewed_count: reviewed,
      blocked_events: blockedEvents || 0,
      pending_reviews: pendingReviews || 0,
      reviewed_percentage: reviewedPercentage,
    };
  } catch (err) {
    console.error('Get system stats error:', err);
    return {
      total_sessions: 0,
      reviewed_count: 0,
      blocked_events: 0,
      pending_reviews: 0,
      reviewed_percentage: 0,
    };
  }
};
