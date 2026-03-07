import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Env } from './types';

/**
 * Create a Supabase client using the service role key.
 * The Worker needs write access (bypasses RLS) so we use
 * the service_role key, NOT the anon key.
 */
export function createSupabaseClient(env: Env): SupabaseClient {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
  });
}
