"use client"

import { useInfiniteQuery } from "@tanstack/react-query"
import type { RoomListPage } from "@/lib/rooms/room.client.types"
import { apiClient } from "@/lib/utils/client"

type ApiResponse<T> = {
  data: T
}

export const roomsQueryKey = ["rooms"] as const
const DEFAULT_ROOMS_LIMIT = 10

export const useRooms = () => {
  return useInfiniteQuery({
    queryKey: roomsQueryKey,
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }) => {
      const searchParams = new URLSearchParams({
        limit: String(DEFAULT_ROOMS_LIMIT),
      })

      if (pageParam) {
        searchParams.set("cursor", pageParam)
      }

      const response = await apiClient.get<ApiResponse<RoomListPage>>(`/rooms?${searchParams.toString()}`)
      return response.data
    },
    getNextPageParam: (lastPage) => lastPage.pageInfo.nextCursor ?? undefined,
  })
}
