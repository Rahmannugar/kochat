"use client"

import { createClient } from "@supabase/supabase-js"

let cachedBrowserClient: ReturnType<typeof createClient> | undefined

const fetchRealtimeToken = async () => {
  const response = await fetch("/api/realtime/token", {
    method: "GET",
    credentials: "same-origin",
    cache: "no-store",
  })

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "")
    console.error("[realtime] failed to fetch token", {
      status: response.status,
      body: errorBody,
    })
    throw new Error("Unable to authorize realtime channels")
  }

  const payload = (await response.json()) as {
    data?: {
      token?: string
    }
  }

  const token = payload.data?.token

  if (!token) {
    console.error("[realtime] token response missing token", payload)
    throw new Error("Realtime token was not returned")
  }

  return token
}

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
    accessToken: fetchRealtimeToken,
    realtime: {
      params: {
        log_level: "info",
      },
      logger: (kind, msg, data) => {
        console.info(`[supabase-realtime:${kind}] ${msg}`, data)
      },
    },
  })

  return cachedBrowserClient
}
