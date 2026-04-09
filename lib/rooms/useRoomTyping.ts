"use client"

import { useCallback, useEffect, useRef } from "react"
import type { RealtimeChannel } from "@supabase/supabase-js"
import type { AuthUser } from "@/lib/auth/auth.types"
import { acquireRoomChannel, releaseRoomChannel } from "@/lib/realtime/room-channel.client"

export const useRoomTyping = ({
  roomId,
  user,
  debounceMs = 300,
}: {
  roomId?: string
  user: AuthUser
  debounceMs?: number
}) => {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isTypingRef = useRef(false)
  const channelRef = useRef<RealtimeChannel | null>(null)

  const setTyping = useCallback(
    async (isTyping: boolean) => {
      if (!roomId) {
        return
      }

      if (isTypingRef.current === isTyping) {
        return
      }

      isTypingRef.current = isTyping
      if (!channelRef.current) {
        channelRef.current = await acquireRoomChannel(roomId, user.id)
      }

      await channelRef.current.send({
        type: "broadcast",
        event: "typing.updated",
        payload: {
          userId: user.id,
          userName: user.name ?? user.username ?? null,
          isTyping,
        },
      })
    },
    [roomId, user.id, user.name, user.username],
  )

  useEffect(() => {
    if (!roomId) {
      channelRef.current = null
      return
    }

    let isMounted = true

    void acquireRoomChannel(roomId, user.id)
      .then(async (channel) => {
        if (!isMounted) {
          await releaseRoomChannel(roomId)
          return
        }

        channelRef.current = channel
      })
      .catch(() => {})

    return () => {
      isMounted = false
    }
  }, [roomId, user.id])

  const notifyTyping = useCallback(() => {
    if (!roomId) {
      return
    }

    void setTyping(true)

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      void setTyping(false)
    }, debounceMs)
  }, [debounceMs, roomId, setTyping])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      if (roomId) {
        void setTyping(false).finally(() => {
          channelRef.current = null
          void releaseRoomChannel(roomId)
        })
      }
    }
  }, [roomId, setTyping])

  return {
    notifyTyping,
    setTyping,
  }
}
