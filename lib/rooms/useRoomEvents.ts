"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import type { RealtimeChannel } from "@supabase/supabase-js"
import type {
  ActiveUser,
  MessageCreatedEvent,
  ReceiptsUpdatedEvent,
  RoomEventPayload,
  TypingUser,
} from "@/lib/realtime/realtime-event.types"
import type { PaginatedMessages } from "@/lib/messages/message.client.types"
import { roomMessagesQueryKey } from "@/lib/rooms/useRoomMessages"
import { acquireRoomChannel, releaseRoomChannel } from "@/lib/realtime/room-channel.client"
import type { AuthUser } from "@/lib/auth/auth.types"

type TypingSignalPayload = {
  userId: string
  userName: string | null
  isTyping: boolean
}

const TYPING_TTL_MS = 3_000

const mapPresenceStateToActiveUsers = (
  channel: RealtimeChannel,
): ActiveUser[] => {
  const rawState = channel.presenceState<Record<string, unknown>>()
  const activeUsers = Object.values(rawState)
    .flatMap((entries) => entries)
    .map((entry) => ({
      userId: typeof entry.userId === "string" ? entry.userId : "",
      userName: typeof entry.userName === "string" ? entry.userName : null,
      image: typeof entry.image === "string" ? entry.image : null,
      lastSeenAt:
        typeof entry.lastSeenAt === "string"
          ? entry.lastSeenAt
          : new Date().toISOString(),
    }))
    .filter((entry) => entry.userId)

  return activeUsers.filter(
    (entry, index, entries) =>
      entries.findIndex((candidate) => candidate.userId === entry.userId) === index,
  )
}

export const useRoomEvents = (roomId: string | undefined, user: AuthUser) => {
  const queryClient = useQueryClient()
  const pendingMessagesRef = useRef<PaginatedMessages["items"]>([])
  const typingTimeoutsRef = useRef(new Map<string, ReturnType<typeof setTimeout>>())
  const typingUsersRef = useRef(new Map<string, TypingUser>())
  const [connectionState, setConnectionState] = useState<
    "idle" | "connecting" | "open" | "closed" | "error"
  >("idle")
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([])
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([])
  const [latestEvent, setLatestEvent] = useState<RoomEventPayload | null>(null)

  const clearTypingTimers = () => {
    for (const timeoutId of typingTimeoutsRef.current.values()) {
      clearTimeout(timeoutId)
    }

    typingTimeoutsRef.current.clear()
    typingUsersRef.current.clear()
    setTypingUsers([])
  }

  useEffect(() => {
    if (!roomId) {
      setConnectionState("idle")
      setTypingUsers([])
      setActiveUsers([])
      setLatestEvent(null)
      pendingMessagesRef.current = []
      clearTypingTimers()
      return
    }

    let isMounted = true
    let channel: RealtimeChannel | null = null

    setConnectionState("connecting")

    void acquireRoomChannel(roomId, user.id)
      .then(async (joinedChannel) => {
        if (!isMounted) {
          await releaseRoomChannel(roomId)
          return
        }

        channel = joinedChannel

        channel.on("broadcast", { event: "message.created" }, ({ payload }) => {
          const roomEvent = payload as MessageCreatedEvent
          setLatestEvent(roomEvent)

          queryClient.setQueryData<
            { pages: PaginatedMessages[]; pageParams: Array<string | null> } | undefined
          >(roomMessagesQueryKey(roomId), (current) => {
            if (!current || current.pages.length === 0) {
              pendingMessagesRef.current = [
                roomEvent.payload.message,
                ...pendingMessagesRef.current.filter(
                  (message) => message.id !== roomEvent.payload.message.id,
                ),
              ]
              return current
            }

            const [firstPage, ...restPages] = current.pages
            const nextItems = [
              roomEvent.payload.message,
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
          })
        })

        channel.on("broadcast", { event: "receipts.updated" }, ({ payload }) => {
          setLatestEvent(payload as ReceiptsUpdatedEvent)
          void queryClient.invalidateQueries({
            queryKey: roomMessagesQueryKey(roomId),
          })
        })

        channel.on("broadcast", { event: "typing.updated" }, ({ payload }) => {
          const typingSignal = payload as TypingSignalPayload

          if (!typingSignal.userId || typingSignal.userId === user.id) {
            return
          }

          if (typingSignal.isTyping) {
            typingUsersRef.current.set(typingSignal.userId, {
              userId: typingSignal.userId,
              userName: typingSignal.userName,
            })

            const previousTimeout = typingTimeoutsRef.current.get(typingSignal.userId)
            if (previousTimeout) {
              clearTimeout(previousTimeout)
            }

            const timeoutId = setTimeout(() => {
              typingUsersRef.current.delete(typingSignal.userId)
              typingTimeoutsRef.current.delete(typingSignal.userId)
              setTypingUsers(Array.from(typingUsersRef.current.values()))
            }, TYPING_TTL_MS)

            typingTimeoutsRef.current.set(typingSignal.userId, timeoutId)
          } else {
            const previousTimeout = typingTimeoutsRef.current.get(typingSignal.userId)
            if (previousTimeout) {
              clearTimeout(previousTimeout)
            }
            typingTimeoutsRef.current.delete(typingSignal.userId)
            typingUsersRef.current.delete(typingSignal.userId)
          }

          setTypingUsers(Array.from(typingUsersRef.current.values()))
        })

        channel.on("presence", { event: "sync" }, () => {
          setActiveUsers(mapPresenceStateToActiveUsers(channel!))
        })

        setActiveUsers(mapPresenceStateToActiveUsers(channel))
        setConnectionState("open")
        void queryClient.invalidateQueries({
          queryKey: roomMessagesQueryKey(roomId),
        })
      })
      .catch(() => {
        if (!isMounted) {
          return
        }

        setConnectionState("error")
      })

    return () => {
      isMounted = false
      clearTypingTimers()
      setActiveUsers([])
      setLatestEvent(null)
      pendingMessagesRef.current = []

      if (roomId) {
        void releaseRoomChannel(roomId)
      }
    }
  }, [queryClient, roomId, user.id])

  return useMemo(
    () => ({
      connectionState,
      typingUsers,
      activeUsers,
      latestEvent,
    }),
    [activeUsers, connectionState, latestEvent, typingUsers],
  )
}
