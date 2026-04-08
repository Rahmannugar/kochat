"use client"

import { useQuery } from "@tanstack/react-query"
import type { SearchMessageResult } from "@/lib/messages/message.client.types"
import { apiClient } from "@/lib/utils/client"

type ApiResponse<T> = {
  data: T
}

export const roomMessageSearchQueryKey = (roomId: string, query: string) => [
  "rooms",
  roomId,
  "messages",
  "search",
  query,
] as const

export const useRoomMessageSearch = ({
  roomId,
  query,
  enabled = true,
  limit = 20,
}: {
  roomId?: string
  query: string
  enabled?: boolean
  limit?: number
}) => {
  const normalizedQuery = query.trim()

  return useQuery({
    queryKey: roomId
      ? roomMessageSearchQueryKey(roomId, normalizedQuery)
      : ["rooms", "search", "disabled"],
    enabled: Boolean(roomId && normalizedQuery && enabled),
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<SearchMessageResult[]>>(
        `/rooms/${roomId}/messages/search?query=${encodeURIComponent(normalizedQuery)}&limit=${limit}`,
      )

      return response.data
    },
  })
}
