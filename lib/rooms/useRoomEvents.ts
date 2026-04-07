"use client"

import { useEffect, useRef, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import type { RoomEventMessage } from "@/lib/messages/message.client.types"
import type {
  ActiveUser,
  RoomEventPayload,
  TypingUser,
} from "@/lib/realtime/realtime-event.types"
import type {
  PaginatedMessages,
} from "@/lib/messages/message.client.types"
import { roomMessagesQueryKey } from "@/lib/rooms/useRoomMessages"

export const useRoomEvents = (roomId?: string) => {
  const queryClient = useQueryClient()
  const pendingMessagesRef = useRef<RoomEventMessage[]>([])
  const [connectionState, setConnectionState] = useState<
    "idle" | "connecting" | "open" | "closed" | "error"
  >("idle")
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([])
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([])
  const [latestEvent, setLatestEvent] = useState<RoomEventPayload | null>(null)

  useEffect(() => {
    if (!roomId) {
      setConnectionState("idle")
      setTypingUsers([])
      setActiveUsers([])
      setLatestEvent(null)
      pendingMessagesRef.current = []
      return
    }

    setConnectionState("connecting")

    const eventSource = new EventSource(`/api/rooms/${roomId}/events`)

    eventSource.addEventListener("open", () => {
      setConnectionState("open")
    })

    eventSource.addEventListener("error", () => {
      setConnectionState("error")
    })

    eventSource.addEventListener("ready", () => {
      setConnectionState("open")
    })

    eventSource.onmessage = (event) => {
      const payload = JSON.parse(event.data) as RoomEventPayload
      setLatestEvent(payload)

      if (payload.type === "typing.updated") {
        setTypingUsers(payload.payload.typingUsers)
        return
      }

      if (payload.type === "presence.updated") {
        setActiveUsers(payload.payload.activeUsers)
        return
      }

      if (payload.type === "message.created") {
        queryClient.setQueryData<
          { pages: PaginatedMessages[]; pageParams: Array<string | null> } | undefined
        >(
          roomMessagesQueryKey(roomId),
          (current) => {
            if (!current || current.pages.length === 0) {
              pendingMessagesRef.current = [
                payload.payload.message,
                ...pendingMessagesRef.current.filter(
                  (message) => message.id !== payload.payload.message.id,
                ),
              ]
              return current
            }

            const [firstPage, ...restPages] = current.pages
            const nextItems = [
              payload.payload.message,
              ...pendingMessagesRef.current,
              ...firstPage.items,
            ].filter(
              (message, index, items) =>
                items.findIndex((candidate) => candidate.id === message.id) === index,
            )

            pendingMessagesRef.current = []

            return {
              ...current,
              pages: [
                {
                  ...firstPage,
                  items: nextItems,
                },
                ...restPages,
              ],
            }
          },
        )
      }
    }

    return () => {
      eventSource.close()
      setConnectionState("closed")
    }
  }, [queryClient, roomId])

  return {
    connectionState,
    typingUsers,
    activeUsers,
    latestEvent,
  }
}
