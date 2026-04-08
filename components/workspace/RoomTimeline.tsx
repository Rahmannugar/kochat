"use client"

import { useMemo } from "react"
import Link from "next/link"
import {
  CircleNotchIcon,
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
  streamedAiText?: string
  isAiStreaming?: boolean
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
  currentUserId,
}: {
  message: RoomEventMessage
  isOwnMessage: boolean
  currentUserId: string
}) => {
  const senderName =
    message.sender === "ai"
      ? "Kochat AI"
      : message.senderUser?.name || message.senderUser?.username || "Unknown user"
  const senderProfileHref =
    message.sender === "human" && message.senderUser?.id
      ? message.senderUser.id === currentUserId
        ? "/profile"
        : `/users/${message.senderUser.id}`
      : null
  const aiMark = (
    <span className="relative inline-flex size-7 items-center justify-center overflow-hidden rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.95),rgba(255,255,255,0.18)_22%,transparent_23%),linear-gradient(135deg,rgba(12,92,255,0.95),rgba(20,184,166,0.95))] text-[10px] font-semibold tracking-[0.2em] text-white shadow-sm">
      AI
    </span>
  )

  return (
    <div
      className={cn(
        "flex gap-3",
        isOwnMessage ? "justify-end" : "justify-start",
      )}
    >
      {!isOwnMessage ? (
        senderProfileHref ? (
          <Link href={senderProfileHref} className="mt-1 block transition-opacity hover:opacity-80">
            <Avatar size="sm">
              <AvatarImage
                src={message.sender === "human" ? (message.senderUser?.image ?? undefined) : undefined}
                alt={senderName}
              />
              <AvatarFallback
                className={cn(
                  message.sender === "ai" &&
                    "bg-transparent p-0 text-white",
                )}
              >
                {message.sender === "ai" ? aiMark : getInitials(senderName)}
              </AvatarFallback>
            </Avatar>
          </Link>
        ) : (
          <Avatar size="sm" className="mt-1">
            <AvatarImage
              src={message.sender === "human" ? (message.senderUser?.image ?? undefined) : undefined}
              alt={senderName}
            />
            <AvatarFallback
              className={cn(
                message.sender === "ai" &&
                  "bg-transparent p-0 text-white",
              )}
            >
              {message.sender === "ai" ? aiMark : getInitials(senderName)}
            </AvatarFallback>
          </Avatar>
        )
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
                ? "border border-sky-500/20 bg-[linear-gradient(180deg,rgba(23,37,84,0.03),rgba(14,165,233,0.08))] text-foreground dark:bg-[linear-gradient(180deg,rgba(37,99,235,0.12),rgba(20,184,166,0.08))]"
                : "border border-border/60 bg-background text-foreground",
          )}
        >
          {!isOwnMessage ? (
            <div className="mb-1 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] opacity-70">
              {senderProfileHref ? (
                <Link
                  href={senderProfileHref}
                  className="transition-opacity hover:opacity-70"
                >
                  {senderName}
                </Link>
              ) : (
                <span>{senderName}</span>
              )}
            </div>
          ) : null}

          {message.content ? (
            <p className="whitespace-pre-wrap break-words text-sm leading-6">
              {message.content}
            </p>
          ) : null}

          {message.imageUrl ? (
            <div className="mt-3 overflow-hidden rounded-[1rem] border border-black/5 bg-black/5 dark:border-white/10 dark:bg-white/5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={message.imageUrl}
                alt={message.content || "Shared image"}
                className="max-h-80 w-full object-cover"
              />
            </div>
          ) : null}

          {message.audioUrl ? (
            <div className="mt-3 rounded-[1rem] border border-black/5 bg-black/5 p-3 dark:border-white/10 dark:bg-white/5">
              <audio controls className="w-full" src={message.audioUrl}>
                Your browser does not support audio playback.
              </audio>
            </div>
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
        <Link href="/profile" className="mt-1 block transition-opacity hover:opacity-80">
          <Avatar size="sm">
            <AvatarImage src={message.senderUser?.image ?? undefined} alt={senderName} />
            <AvatarFallback>{getInitials(senderName)}</AvatarFallback>
          </Avatar>
        </Link>
      ) : null}
    </div>
  )
}

export const RoomTimeline = ({
  room,
  user,
  streamedAiText = "",
  isAiStreaming = false,
}: RoomTimelineProps) => {
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
  const totalActiveUsers = activeUsers.some((activeUser) => activeUser.userId === user.id)
    ? activeUsers.length
    : activeUsers.length + 1

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
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
          {totalActiveUsers} active
        </Badge>
        {otherTypingUsers.length > 0 ? (
          <Badge variant="outline" className="h-7 rounded-full px-3">
            <CircleNotchIcon size={12} className="animate-spin" />
            {otherTypingUsers.map((typingUser) => typingUser.userName || "Someone").join(", ")} typing
          </Badge>
        ) : null}
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden rounded-[1.75rem] border border-border/60 bg-muted/20">
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
                  currentUserId={user.id}
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

            {isAiStreaming && streamedAiText ? (
              <MessageBubble
                message={{
                  id: "streaming-ai-message",
                  roomId: room.id,
                  sender: "ai",
                  senderUserId: null,
                  content: streamedAiText,
                  messageType: "text",
                  imageUrl: null,
                  audioUrl: null,
                  audioTranscript: null,
                  metadata: null,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  senderUser: null,
                }}
                isOwnMessage={false}
                currentUserId={user.id}
              />
            ) : null}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
