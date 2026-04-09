"use client"

import { useEffect } from "react"
import type { RealtimeChannel } from "@supabase/supabase-js"
import type { AuthUser } from "@/lib/auth/auth.types"
import { acquireRoomChannel, releaseRoomChannel } from "@/lib/realtime/room-channel.client"

const PRESENCE_HEARTBEAT_MS = 20_000

export const useRoomPresence = (roomId: string | undefined, user: AuthUser) => {
  useEffect(() => {
    if (!roomId) {
      return
    }

    let isMounted = true
    let channel: RealtimeChannel | null = null

    const trackPresence = async (active: boolean) => {
      if (!channel) {
        return
      }

      try {
        if (active) {
          await channel.track({
            userId: user.id,
            userName: user.name ?? user.username ?? null,
            image: user.image ?? null,
            lastSeenAt: new Date().toISOString(),
          })
          return
        }

        await channel.untrack()
      } catch {
        // Presence is best-effort in the client.
      }
    }

    void acquireRoomChannel(roomId, user.id)
      .then(async (joinedChannel) => {
        if (!isMounted) {
          await releaseRoomChannel(roomId)
          return
        }

        channel = joinedChannel
        await trackPresence(true)
      })
      .catch(() => {})

    const heartbeatId = setInterval(() => {
      void trackPresence(!document.hidden)
    }, PRESENCE_HEARTBEAT_MS)

    const handleVisibilityChange = () => {
      void trackPresence(!document.hidden)
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      isMounted = false
      clearInterval(heartbeatId)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      void trackPresence(false).finally(() => {
        void releaseRoomChannel(roomId)
      })
    }
  }, [roomId, user.id, user.image, user.name, user.username])
}
