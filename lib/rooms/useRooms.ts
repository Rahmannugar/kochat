"use client"

import { useQuery } from "@tanstack/react-query"
import type { RoomListItem } from "@/lib/rooms/room.client.types"
import { apiClient } from "@/lib/utils/client"

type ApiResponse<T> = {
  data: T
}

export const roomsQueryKey = ["rooms"] as const

export const useRooms = () => {
  return useQuery({
    queryKey: roomsQueryKey,
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<RoomListItem[]>>("/rooms")
      return response.data
    },
  })
}
