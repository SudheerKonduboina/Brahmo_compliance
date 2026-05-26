import { supabaseBrowser } from './supabase';
import { supabaseServer } from './supabaseServer';
import { AccessCheckResponse, Matter, AISession } from './types';

/**
 * Check if a user can access a specific matter
 * This query is protected by RLS policies at the database level
 * If the user lacks permission, the query returns 0 rows (not an error)
 */
export const checkMatterAccess = async (
  _userId: string,
  matterId: string
): Promise<AccessCheckResponse> => {
  try {
    // Query the user_matters view - already filtered by permissions at database level
    const { data, error } = await supabaseBrowser
      .from('matters')
      .select('id')
      .eq('id', matterId)
      .single();

    if (error?.code === 'PGRST116') {
      // No rows returned - access denied (handled by RLS)
      return {
        allowed: false,
        reason: 'no_permission',
      };
    }

    if (error) {
      console.error('[BRAHMO] Access check database error:', {
        code: error.code,
        message: error.message,
        matterId,
      });
      return {
        allowed: false,
        reason: 'database_error',
      };
    }

    if (!data) {
      // Access denied - matter doesn't exist or user has no permission
      return {
        allowed: false,
        reason: 'no_permission',
      };
    }

    return {
      allowed: true,
    };
  } catch (err) {
    console.error('[BRAHMO] Access check unexpected error:', err);
    return {
      allowed: false,
      reason: 'system_error',
    };
  }
};

/**
 * Get all matters accessible to the current user
 * RLS policies ensure only permitted matters are returned
 */
export const getAccessibleMatters = async (): Promise<Matter[]> => {
  try {
    const { data, error } = await supabaseBrowser
      .from('matters')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[BRAHMO] Failed to fetch accessible matters:', {
        code: error.code,
        message: error.message,
      });
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('[BRAHMO] Unexpected error fetching matters:', err);
    return [];
  }
};

/**
 * Log a blocked access attempt
 * Computes hash chain for tamper detection
 * Inserts immutable append-only log entry
 */
export const logBlockedAccess = async (
  userId: string,
  matterId: string,
  reason: 'no_permission' | 'matter_not_found' | 'status_inactive',
  details?: string
): Promise<string | null> => {
  try {
    // Get the previous hash to chain
    const { data: previousEvent } = await supabaseServer
      .from('blocked_access_log')
      .select('current_hash')
      .order('timestamp', { ascending: false })
      .limit(1)
      .maybeSingle();

    const previousHash = previousEvent?.current_hash || null;

    // Compute current hash using hash chain
    const { computeBlockedAccessHash } = await import('./hash-chain');
    const currentHash = await computeBlockedAccessHash(
      previousHash,
      userId,
      matterId,
      reason,
      new Date().toISOString()
    );

    // Insert the blocked access event
    // UPDATE and DELETE are revoked at database level, making this append-only
    const { data, error } = await supabaseServer
      .from('blocked_access_log')
      .insert({
        user_id: userId,
        attempted_matter_id: matterId,
        reason,
        details: details || null,
        timestamp: new Date().toISOString(),
        previous_hash: previousHash,
        current_hash: currentHash,
      })
      .select('event_id')
      .single();

    if (error) {
      console.error('Error logging blocked access:', error);
      return null;
    }

    return data?.event_id || null;
  } catch (err) {
    console.error('Log blocked access error:', err);
    return null;
  }
};

/**
 * Get sessions accessible to the user
 * RLS enforces that users only see:
 * - Their own sessions
 * - Sessions on matters they have access to
 * - Partners can see all sessions
 */
export const getAccessibleSessions = async (): Promise<AISession[]> => {
  try {
    const { data, error } = await supabaseBrowser
      .from('ai_sessions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[BRAHMO] Failed to fetch accessible sessions:', {
        code: error.code,
        message: error.message,
      });
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('[BRAHMO] Unexpected error fetching sessions:', err);
    return [];
  }
};

/**
 * Verify matter exists and user has access
 * Returns the matter if accessible, null otherwise
 */
export const getMatterIfAccessible = async (
  matterId: string
): Promise<Matter | null> => {
  try {
    const { data, error } = await supabaseBrowser
      .from('matters')
      .select('*')
      .eq('id', matterId)
      .single();

    if (error?.code === 'PGRST116' || !data) {
      // No rows - access denied by RLS
      return null;
    }

    if (error) {
      throw error;
    }

    return data;
  } catch (err) {
    console.error('Get matter error:', err);
    return null;
  }
};

/**
 * Verify session exists and user has access
 * Returns the session if accessible, null otherwise
 */
export const getSessionIfAccessible = async (
  sessionId: string
): Promise<AISession | null> => {
  try {
    const { data, error } = await supabaseBrowser
      .from('ai_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error?.code === 'PGRST116' || !data) {
      // No rows - access denied by RLS
      return null;
    }

    if (error) {
      throw error;
    }

    return data;
  } catch (err) {
    console.error('Get session error:', err);
    return null;
  }
};
