import { createClient } from "@supabase/supabase-js"
import { getServerEnv } from "@/lib/env/server"

let cachedAdminClient: ReturnType<typeof createClient> | undefined

export const getSupabaseAdmin = () => {
  if (cachedAdminClient) {
    return cachedAdminClient
  }

  const env = getServerEnv()

  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase storage env is not configured")
  }

  cachedAdminClient = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  )

  return cachedAdminClient
}
