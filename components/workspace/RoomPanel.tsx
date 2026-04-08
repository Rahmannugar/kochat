"use client"

import { useEffect, useRef, useState } from "react"
import { useAiStream } from "@/lib/ai/useAiStream"
import { useRoomEvents } from "@/lib/rooms/useRoomEvents"
import { RoomComposer } from "@/components/workspace/RoomComposer"
import { RoomMembersPanel } from "@/components/workspace/RoomMembersPanel"
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
  const roomEvents = useRoomEvents(room.id)
  const [focusedMessageId, setFocusedMessageId] = useState<string | null>(null)
  const [activeView, setActiveView] = useState<"messages" | "members">("messages")
  const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setActiveView("messages")
    setFocusedMessageId(null)
  }, [room.id])

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
    <div className="flex min-h-[580px] min-w-0 flex-col gap-4">
      {activeView === "messages" ? (
        <>
          <RoomSearchPanel roomId={room.id} onSelectMessage={handleSelectMessage} />
          <RoomTimeline
            room={room}
            user={user}
            streamedAiText={aiStream.streamedText}
            isAiStreaming={aiStream.isStreaming}
            focusedMessageId={focusedMessageId}
            connectionState={roomEvents.connectionState}
            typingUsers={roomEvents.typingUsers}
            activeUsers={roomEvents.activeUsers}
            onOpenMembers={() => setActiveView("members")}
          />
          <RoomComposer roomId={room.id} onAiTrigger={aiStream.startStream} />
        </>
      ) : (
        <RoomMembersPanel
          room={room}
          activeUsers={roomEvents.activeUsers}
          currentUserId={user.id}
          onBack={() => setActiveView("messages")}
        />
      )}
    </div>
  )
}
