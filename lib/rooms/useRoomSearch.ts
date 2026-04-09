"use client"

import { useInfiniteQuery } from "@tanstack/react-query"
import type { RoomListPage } from "@/lib/rooms/room.client.types"
import { apiClient } from "@/lib/utils/client"

type ApiResponse<T> = {
  data: T
}

const DEFAULT_ROOMS_SEARCH_LIMIT = 10

export const useRoomSearch = (query: string) => {
  const normalizedQuery = query.trim()

  return useInfiniteQuery({
    queryKey: ["rooms", "search", normalizedQuery],
    initialPageParam: null as string | null,
    enabled: normalizedQuery.length > 0,
    queryFn: async ({ pageParam }) => {
      const searchParams = new URLSearchParams({
        query: normalizedQuery,
        limit: String(DEFAULT_ROOMS_SEARCH_LIMIT),
      })

      if (pageParam) {
        searchParams.set("cursor", pageParam)
      }

      const response = await apiClient.get<ApiResponse<RoomListPage>>(
        `/rooms/search?${searchParams.toString()}`,
      )

      return response.data
    },
    getNextPageParam: (lastPage) => lastPage.pageInfo.nextCursor ?? undefined,
  })
}
