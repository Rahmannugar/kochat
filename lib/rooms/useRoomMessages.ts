"use client"

import { useInfiniteQuery } from "@tanstack/react-query"
import type { PaginatedMessages } from "@/lib/messages/message.client.types"
import { apiClient } from "@/lib/utils/client"

type ApiResponse<T> = {
  data: T
}

export const roomMessagesQueryKey = (roomId: string) =>
  ["rooms", roomId, "messages"] as const

export const useRoomMessages = ({
  roomId,
  limit = 30,
  enabled = true,
}: {
  roomId?: string
  limit?: number
  enabled?: boolean
}) => {
  return useInfiniteQuery({
    queryKey: roomId ? roomMessagesQueryKey(roomId) : ["rooms", "messages", "idle"],
    enabled: Boolean(roomId) && enabled,
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }) => {
      const searchParams = new URLSearchParams({
        limit: String(limit),
      })

      if (pageParam) {
        searchParams.set("cursor", pageParam)
      }

      const response = await apiClient.get<ApiResponse<PaginatedMessages>>(
        `/rooms/${roomId}/messages?${searchParams.toString()}`,
      )

      return response.data
    },
    getNextPageParam: (lastPage) => lastPage.pageInfo.nextCursor,
  })
}
