"use client"

import { useEffect } from "react"
import { apiClient } from "@/lib/utils/client"

const PRESENCE_HEARTBEAT_MS = 20_000

type ApiResponse<T> = {
  data: T
}

export const useRoomPresence = (roomId?: string) => {
  useEffect(() => {
    if (!roomId) {
      return
    }

    const sendPresence = async (active: boolean) => {
      try {
        await apiClient.post<ApiResponse<{ activeUsers: unknown[] }>>(
          `/rooms/${roomId}/presence`,
          { active },
          active
            ? undefined
            : {
                keepalive: true,
              },
        )
      } catch {
        // Presence is best-effort; ignore shutdown/visibility transport failures.
      }
    }

    void sendPresence(true)

    const heartbeatId = setInterval(() => {
      void sendPresence(true)
    }, PRESENCE_HEARTBEAT_MS)

    const handleVisibilityChange = () => {
      void sendPresence(!document.hidden)
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      clearInterval(heartbeatId)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      void sendPresence(false)
    }
  }, [roomId])
}
