"use client"

import { useRef, useState } from "react"
import { useAiStream } from "@/lib/ai/useAiStream"
import { RoomComposer } from "@/components/workspace/RoomComposer"
import { RoomSearchPanel } from "@/components/workspace/RoomSearchPanel"
import { RoomTimeline } from "@/components/workspace/RoomTimeline"
import type { RoomListItem } from "@/lib/rooms/room.client.types"
import type { AuthUser } from "@/lib/auth/auth.types"

type RoomPanelProps = {
  room: RoomListItem["room"]
  user: AuthUser
}

export const RoomPanel = ({ room, user }: RoomPanelProps) => {
  const aiStream = useAiStream(room.id)
  const [focusedMessageId, setFocusedMessageId] = useState<string | null>(null)
  const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleSelectMessage = (messageId: string) => {
    setFocusedMessageId(messageId)

    if (highlightTimeoutRef.current) {
      clearTimeout(highlightTimeoutRef.current)
    }

    highlightTimeoutRef.current = setTimeout(() => {
      setFocusedMessageId((current) => (current === messageId ? null : current))
      highlightTimeoutRef.current = null
    }, 1800)
  }

  return (
    <div className="flex min-h-[580px] flex-col gap-4">
      <RoomSearchPanel roomId={room.id} onSelectMessage={handleSelectMessage} />
      <RoomTimeline
        room={room}
        user={user}
        streamedAiText={aiStream.streamedText}
        isAiStreaming={aiStream.isStreaming}
        focusedMessageId={focusedMessageId}
      />
      <RoomComposer roomId={room.id} onAiTrigger={aiStream.startStream} />
    </div>
  )
}
