"use client"

import { useAiStream } from "@/lib/ai/useAiStream"
import { RoomComposer } from "@/components/workspace/RoomComposer"
import { RoomTimeline } from "@/components/workspace/RoomTimeline"
import type { RoomListItem } from "@/lib/rooms/room.client.types"
import type { AuthUser } from "@/lib/auth/auth.types"

type RoomPanelProps = {
  room: RoomListItem["room"]
  user: AuthUser
}

export const RoomPanel = ({ room, user }: RoomPanelProps) => {
  const aiStream = useAiStream(room.id)

  return (
    <div className="flex min-h-[580px] flex-col gap-4">
      <RoomTimeline
        room={room}
        user={user}
        streamedAiText={aiStream.streamedText}
        isAiStreaming={aiStream.isStreaming}
      />
      <RoomComposer roomId={room.id} onAiTrigger={aiStream.startStream} />
    </div>
  )
}
