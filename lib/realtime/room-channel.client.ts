"use client"

import type { RealtimeChannel } from "@supabase/supabase-js"
import { getSupabaseBrowser } from "@/lib/supabase/browser"

type RoomChannelEntry = {
  channel: RealtimeChannel
  refCount: number
  joined: Promise<RealtimeChannel>
}

const roomChannels = new Map<string, RoomChannelEntry>()

export const getRoomTopic = (roomId: string) => `room:${roomId}`

export const acquireRoomChannel = async (roomId: string, userId: string) => {
  const existingEntry = roomChannels.get(roomId)

  if (existingEntry) {
    existingEntry.refCount += 1
    return existingEntry.joined
  }

  const supabase = getSupabaseBrowser()
  const channel = supabase.channel(getRoomTopic(roomId), {
    config: {
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
