"use client"

import { useMemo } from "react"
import {
  CircleNotchIcon,
  LightningIcon,
  RobotIcon,
  UsersThreeIcon,
  WifiHighIcon,
  WifiSlashIcon,
} from "@phosphor-icons/react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useRoomMessages } from "@/lib/rooms/useRoomMessages"
import { useRoomEvents } from "@/lib/rooms/useRoomEvents"
import { useRoomPresence } from "@/lib/rooms/useRoomPresence"
import type { RoomEventMessage } from "@/lib/messages/message.client.types"
import type { RoomListItem } from "@/lib/rooms/room.client.types"
import type { AuthUser } from "@/lib/auth/auth.types"
import { cn } from "@/lib/utils"

type RoomTimelineProps = {
  room: RoomListItem["room"]
  user: AuthUser
}

const formatTime = (value: string | Date) => {
  const date = value instanceof Date ? value : new Date(value)

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date)
}

const getInitials = (value: string | null | undefined) =>
  (value ?? "K")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")

const getConnectionLabel = (
  connectionState: "idle" | "connecting" | "open" | "closed" | "error",
) => {
  switch (connectionState) {
    case "open":
      return "Live"
    case "connecting":
      return "Connecting"
    case "error":
      return "Reconnect needed"
    case "closed":
      return "Closed"
    default:
      return "Idle"
  }
}

const MessageBubble = ({
  message,
  isOwnMessage,
}: {
  message: RoomEventMessage
  isOwnMessage: boolean
}) => {
  const senderName =
    message.sender === "ai"
      ? "Kochat AI"
      : message.senderUser?.name || message.senderUser?.username || "Unknown user"

  return (
    <div
      className={cn(
        "flex gap-3",
        isOwnMessage ? "justify-end" : "justify-start",
      )}
    >
      {!isOwnMessage ? (
        <Avatar size="sm" className="mt-1">
          <AvatarImage
            src={message.sender === "human" ? (message.senderUser?.image ?? undefined) : undefined}
            alt={senderName}
          />
          <AvatarFallback className={cn(message.sender === "ai" && "bg-primary/12 text-primary")}>
            {message.sender === "ai" ? <RobotIcon size={12} weight="fill" /> : getInitials(senderName)}
          </AvatarFallback>
        </Avatar>
      ) : null}

      <div
        className={cn(
          "max-w-[78%] space-y-1",
          isOwnMessage ? "items-end text-right" : "items-start text-left",
        )}
      >
        <div
          className={cn(
            "rounded-[1.45rem] px-4 py-3 shadow-sm",
            isOwnMessage
              ? "bg-primary text-primary-foreground"
              : message.sender === "ai"
                ? "border border-primary/20 bg-primary/8 text-foreground"
                : "border border-border/60 bg-background text-foreground",
          )}
        >
          {!isOwnMessage ? (
            <div className="mb-1 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] opacity-70">
              <span>{senderName}</span>
              {message.sender === "ai" ? <LightningIcon size={12} weight="fill" /> : null}
            </div>
          ) : null}

          {message.content ? (
            <p className="whitespace-pre-wrap break-words text-sm leading-6">
              {message.content}
            </p>
          ) : null}

          {message.messageType !== "text" ? (
            <div className="mt-3">
              <Badge
                variant={isOwnMessage ? "secondary" : "outline"}
                className={cn(
                  "h-6 rounded-full px-2.5 text-[11px] uppercase tracking-[0.16em]",
                  isOwnMessage && "bg-white/15 text-primary-foreground",
                )}
              >
                {message.messageType}
              </Badge>
            </div>
          ) : null}
        </div>

        <p className="px-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          {formatTime(message.createdAt)}
        </p>
      </div>

      {isOwnMessage ? (
        <Avatar size="sm" className="mt-1">
          <AvatarImage src={message.senderUser?.image ?? undefined} alt={senderName} />
          <AvatarFallback>{getInitials(senderName)}</AvatarFallback>
        </Avatar>
      ) : null}
    </div>
  )
}

export const RoomTimeline = ({ room, user }: RoomTimelineProps) => {
  const messagesQuery = useRoomMessages({
    roomId: room.id,
  })
  const { connectionState, typingUsers, activeUsers } = useRoomEvents(room.id)

  useRoomPresence(room.id)

  const messages = useMemo(() => {
    if (!messagesQuery.data) {
      return []
    }

    return [...messagesQuery.data.pages]
      .reverse()
      .flatMap((page) => [...page.items].reverse())
  }, [messagesQuery.data])

  const otherTypingUsers = typingUsers.filter((typingUser) => typingUser.userId !== user.id)
  const activeOtherUsers = activeUsers.filter((activeUser) => activeUser.userId !== user.id)

  return (
    <div className="flex min-h-[580px] flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge
          variant={connectionState === "open" ? "secondary" : "outline"}
          className="h-7 rounded-full px-3"
        >
          {connectionState === "open" ? <WifiHighIcon size={12} weight="bold" /> : <WifiSlashIcon size={12} weight="bold" />}
          {getConnectionLabel(connectionState)}
        </Badge>
        <Badge variant="outline" className="h-7 rounded-full px-3">
          <UsersThreeIcon size={12} weight="bold" />
          {activeOtherUsers.length} active
        </Badge>
        {otherTypingUsers.length > 0 ? (
          <Badge variant="outline" className="h-7 rounded-full px-3">
            <CircleNotchIcon size={12} className="animate-spin" />
            {otherTypingUsers.map((typingUser) => typingUser.userName || "Someone").join(", ")} typing
          </Badge>
        ) : null}
      </div>

      <div className="relative flex-1 overflow-hidden rounded-[1.75rem] border border-border/60 bg-muted/20">
        <ScrollArea className="h-[500px] px-4 py-4 md:px-6">
          <div className="space-y-4">
            {messagesQuery.hasNextPage ? (
              <div className="flex justify-center pb-2">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full"
                  onClick={() => void messagesQuery.fetchNextPage()}
                  disabled={messagesQuery.isFetchingNextPage}
                >
                  {messagesQuery.isFetchingNextPage ? "Loading..." : "Load older messages"}
                </Button>
              </div>
            ) : null}

            {messagesQuery.isLoading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    "h-20 rounded-[1.5rem] border border-border/60 bg-background/80",
                    index % 2 === 0 ? "mr-10" : "ml-10",
                  )}
                />
              ))
            ) : messages.length > 0 ? (
              messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isOwnMessage={message.sender === "human" && message.senderUserId === user.id}
                />
              ))
            ) : (
              <div className="flex min-h-[340px] items-center justify-center">
                <div className="max-w-sm text-center">
                  <p className="text-lg font-semibold">No messages yet</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    This room is connected to the real backend now. The next step is the composer,
                    so messages, uploads, and AI prompts can start flowing into this timeline.
                  </p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
