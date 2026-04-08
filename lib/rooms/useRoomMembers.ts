"use client"

import { useInfiniteQuery } from "@tanstack/react-query"
import type { RoomMemberPage } from "@/lib/rooms/room.client.types"
import { apiClient } from "@/lib/utils/client"

type ApiResponse<T> = {
  data: T
}

export const roomMembersQueryKey = (roomId: string) =>
  ["rooms", roomId, "members"] as const

export const useRoomMembers = ({
  roomId,
  limit = 10,
  enabled = true,
}: {
  roomId?: string
  limit?: number
  enabled?: boolean
}) => {
  return useInfiniteQuery({
    queryKey: roomId ? roomMembersQueryKey(roomId) : ["rooms", "members", "idle"],
    enabled: Boolean(roomId) && enabled,
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }) => {
      const searchParams = new URLSearchParams({
        limit: String(limit),
      })

      if (pageParam) {
        searchParams.set("cursor", pageParam)
      }

      const response = await apiClient.get<ApiResponse<RoomMemberPage>>(
        `/rooms/${roomId}/members?${searchParams.toString()}`,
      )

      return response.data
    },
    getNextPageParam: (lastPage) => lastPage.pageInfo.nextCursor ?? undefined,
  })
}
