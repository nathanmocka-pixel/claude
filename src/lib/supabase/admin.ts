import { createClient } from "@supabase/supabase-js";

// Service role client — only use in server actions or route handlers that have already
// authenticated the caller and checked their role. Never import this from a client component.
export function createSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
