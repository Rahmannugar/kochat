"use client"

import { useCallback, useEffect, useRef } from "react"
import { apiClient } from "@/lib/utils/client"

type ApiResponse<T> = {
  data: T
}

export const useRoomTyping = ({
  roomId,
  debounceMs = 300,
}: {
  roomId?: string
  debounceMs?: number
}) => {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isTypingRef = useRef(false)

  const setTyping = useCallback(
    async (isTyping: boolean) => {
      if (!roomId) {
        return
      }

      if (isTypingRef.current === isTyping) {
        return
      }

      isTypingRef.current = isTyping

      await apiClient.post<ApiResponse<{ typingUsers: unknown[] }>>(
        `/rooms/${roomId}/typing`,
        { isTyping },
      )
    },
    [roomId],
  )

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
        void setTyping(false)
      }
    }
  }, [roomId, setTyping])

  return {
    notifyTyping,
    setTyping,
  }
}
