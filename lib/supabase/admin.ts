import { createClient as createSupabaseClient } from "@supabase/supabase-js"

/**
 * Creates a Supabase client with the service_role key.
 * This bypasses RLS and should ONLY be used in server-side code
 * after proper admin authentication has been verified.
 * 
 * NEVER expose this client to the browser.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable")
  }

  if (!supabaseServiceKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY environment variable. " +
      "This is required for admin operations. " +
      "You can find it in your Supabase project settings under API."
    )
  }

  return createSupabaseClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
