"use client"

import { useInfiniteQuery } from "@tanstack/react-query"
import type { SearchMessagePage } from "@/lib/messages/message.client.types"
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

  return useInfiniteQuery({
    queryKey: roomId
      ? roomMessageSearchQueryKey(roomId, normalizedQuery)
      : ["rooms", "search", "disabled"],
    enabled: Boolean(roomId && normalizedQuery && enabled),
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }) => {
      const searchParams = new URLSearchParams({
        query: normalizedQuery,
        limit: String(limit),
      })

      if (pageParam) {
        searchParams.set("cursor", pageParam)
      }

      const response = await apiClient.get<ApiResponse<SearchMessagePage>>(
        `/rooms/${roomId}/messages/search?${searchParams.toString()}`,
      )

      return response.data
    },
    getNextPageParam: (lastPage) => lastPage.pageInfo.nextCursor ?? undefined,
  })
}
