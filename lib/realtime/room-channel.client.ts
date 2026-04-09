"use client"

import type { RealtimeChannel } from "@supabase/supabase-js"
import { getSupabaseBrowser } from "@/lib/supabase/browser"

type RoomChannelEntry = {
  channel: RealtimeChannel
  refCount: number
  joined: Promise<RealtimeChannel>
}

const roomChannels = new Map<string, RoomChannelEntry>()
let realtimeTokenPromise: Promise<string> | null = null

const getRoomTopic = (roomId: string) => `room:${roomId}`

const fetchRealtimeToken = async () => {
  if (realtimeTokenPromise) {
    return realtimeTokenPromise
  }

  realtimeTokenPromise = fetch("/api/realtime/token", {
    method: "GET",
    credentials: "same-origin",
    cache: "no-store",
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error("Unable to authorize realtime channels")
      }

      const payload = (await response.json()) as {
        data?: {
          token?: string
        }
      }

      const token = payload.data?.token

      if (!token) {
        throw new Error("Realtime token was not returned")
      }

      return token
    })
    .finally(() => {
      realtimeTokenPromise = null
    })

  return realtimeTokenPromise
}

export const acquireRoomChannel = async (roomId: string, userId: string) => {
  const existingEntry = roomChannels.get(roomId)

  if (existingEntry) {
    existingEntry.refCount += 1
    return existingEntry.joined
  }

  const supabase = getSupabaseBrowser()
  const token = await fetchRealtimeToken()

  supabase.realtime.setAuth(token)

  const channel = supabase.channel(getRoomTopic(roomId), {
    config: {
      private: true,
      broadcast: {
        self: false,
        ack: true,
      },
      presence: {
        key: userId,
      },
    },
  })

  const joined = new Promise<RealtimeChannel>((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      reject(new Error("Timed out joining realtime room channel"))
    }, 10_000)

    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        window.clearTimeout(timeoutId)
        resolve(channel)
        return
      }

      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        window.clearTimeout(timeoutId)
        reject(new Error(`Realtime room channel failed with status: ${status}`))
      }
    })
  })

  roomChannels.set(roomId, {
    channel,
    refCount: 1,
    joined,
  })

  try {
    await joined
  } catch (error) {
    roomChannels.delete(roomId)
    void supabase.removeChannel(channel)
    throw error
  }

  return channel
}

export const releaseRoomChannel = async (roomId: string) => {
  const entry = roomChannels.get(roomId)

  if (!entry) {
    return
  }

  entry.refCount -= 1

  if (entry.refCount > 0) {
    return
  }

  roomChannels.delete(roomId)
  const supabase = getSupabaseBrowser()
  await supabase.removeChannel(entry.channel)
}
