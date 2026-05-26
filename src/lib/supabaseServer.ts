import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('[BRAHMO CRITICAL] NEXT_PUBLIC_SUPABASE_URL is missing');
}

if (typeof window !== 'undefined') {
  throw new Error('[BRAHMO CRITICAL] supabaseServer.ts must never be imported on the client side!');
}

if (!supabaseServiceRoleKey) {
  console.warn(
    '[BRAHMO WARNING] SUPABASE_SERVICE_ROLE_KEY not set. Server operations will run with anon/authenticated privileges.'
  );
}

export const supabaseServer = createClient(
  supabaseUrl,
  supabaseServiceRoleKey || supabaseAnonKey!
);
