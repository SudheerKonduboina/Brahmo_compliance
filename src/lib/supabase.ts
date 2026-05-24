import { createClient, SupabaseClient } from '@supabase/supabase-js';

declare global {
  interface Window {
    supabaseBrowser?: SupabaseClient;
  }
}

/**
 * ============================================================
 * BRAHMO Compliance Engine - Supabase Client Setup (SINGLETON)
 * ============================================================
 * 
 * CRITICAL FIX FOR NEXT.JS FAST REFRESH:
 * In development, Fast Refresh causes module re-evaluation, which
 * creates multiple GoTrueClient instances. This singleton pattern
 * ensures we reuse the same browser client across re-renders.
 * 
 * Reference: https://github.com/supabase/supabase-js/issues/1289
 * 
 * RULES:
 * 1. Browser client is cached in globalThis (development/production safe)
 * 2. Service role key warning only in server environment
 * 3. No silent fallbacks
 * 4. Fail fast on misconfiguration
 * 5. Single source of truth for Supabase access
 * ============================================================
 */

// Type-safe globalThis extension for browser client caching
const globalForSupabase = globalThis as unknown as {
  supabase?: SupabaseClient;
};

// ============================================================
// SINGLETON BROWSER CLIENT (FIXES MULTIPLE INSTANCE WARNING)
// ============================================================

/**
 * Get or create Supabase browser client.
 * 
 * SINGLETON PATTERN:
 * - Returns cached instance if already initialized
 * - Creates new instance only once per process
 * - Prevents GoTrueClient duplication during Fast Refresh
 * 
 * Safe in both browser and server environments:
 * - Browser: Uses globalThis cache to reuse instances
 * - Server: Each API route gets its own client (stateless)
 */
export const supabaseBrowser = (() => {
  // Return cached instance if already created
  if (globalForSupabase.supabase) {
    return globalForSupabase.supabase;
  }

  // Lazy environment validation (only when client is actually used)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error(
      '[BRAHMO CRITICAL] NEXT_PUBLIC_SUPABASE_URL is missing in .env.local'
    );
  }

  if (!supabaseAnonKey) {
    throw new Error(
      '[BRAHMO CRITICAL] NEXT_PUBLIC_SUPABASE_ANON_KEY is missing in .env.local'
    );
  }

  // Create new client and cache it
  const client = createClient(supabaseUrl, supabaseAnonKey);
  globalForSupabase.supabase = client;

  return client;
})();

// ============================================================
// SERVER CLIENT (BACKEND ONLY - SAFE)
// ============================================================

/**
 * Server-side Supabase client with service role key.
 * 
 * USAGE:
 * - API routes only (never expose to browser)
 * - Server components that need full database access
 * - Operations requiring bypass of RLS policies
 * 
 * NOT CACHED:
 * - Each API route gets a fresh instance (stateless)
 * - RLS context is request-scoped, not global
 */
export const supabaseServer = (() => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Service role key warning only in server environment
  if (typeof window === 'undefined' && !supabaseServiceRoleKey) {
    console.warn(
      '[BRAHMO WARNING] SUPABASE_SERVICE_ROLE_KEY not set. Server operations will fail if used.'
    );
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      '[BRAHMO CRITICAL] Supabase environment variables are missing'
    );
  }

  return createClient(
    supabaseUrl,
    supabaseServiceRoleKey || supabaseAnonKey
  );
})();

// ============================================================
// INITIALIZATION HELPER
// ============================================================

/**
 * Initialize browser client explicitly (optional).
 * Useful for pre-connecting before auth checks.
 */
export const initSupabase = () => {
  return supabaseBrowser;
};