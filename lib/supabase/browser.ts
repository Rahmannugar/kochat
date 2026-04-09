"use client"

import { createClient } from "@supabase/supabase-js"

let cachedBrowserClient: ReturnType<typeof createClient> | undefined

export const getSupabaseBrowser = () => {
  if (cachedBrowserClient) {
    return cachedBrowserClient
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error("Supabase browser env is not configured")
  }

  cachedBrowserClient = createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })

  return cachedBrowserClient
}
