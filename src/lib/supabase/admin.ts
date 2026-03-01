import { createClient } from "@supabase/supabase-js";

/**
 * Supabase admin client using service role key.
 * Bypasses RLS - use only in server-side code (API routes, callbacks).
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
