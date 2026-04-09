"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowDownIcon,
  CircleNotchIcon,
  RobotIcon,
  UsersThreeIcon,
  WifiHighIcon,
  WifiSlashIcon,
} from "@phosphor-icons/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRoomMessages } from "@/lib/rooms/useRoomMessages";
import { apiClient } from "@/lib/utils/client";
import type {
  MessageAttachment,
  RoomEventMessage,
} from "@/lib/messages/message.client.types";
import type { RoomListItem } from "@/lib/rooms/room.client.types";
import type { AuthUser } from "@/lib/auth/auth.types";
import type {
  ActiveUser,
  TypingUser,
} from "@/lib/realtime/realtime-event.types";
import { cn } from "@/lib/utils";

const AI_MENTION_PATTERN = /@ai\b/gi;

type RoomTimelineProps = {
  room: RoomListItem["room"];
  user: AuthUser;
  streamedAiText?: string;
  isAiStreaming?: boolean;
  focusedMessageId?: string | null;
  connectionState: "idle" | "connecting" | "open" | "closed" | "error";
  typingUsers: TypingUser[];
  activeUsers: ActiveUser[];
  onOpenMembers?: () => void;
};

const formatTime = (value: string | Date) => {
  const date = value instanceof Date ? value : new Date(value);

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

const getInitials = (value: string | null | undefined) =>
  (value ?? "K")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

const getConnectionLabel = (
  connectionState: "idle" | "connecting" | "open" | "closed" | "error",
) => {
  switch (connectionState) {
    case "open":
      return "Live";
    case "connecting":
      return "Connecting";
    case "error":
      return "Reconnect needed";
    case "closed":
      return "Closed";
    default:
      return "Idle";
  }
};

const getReceiptLabel = (message: RoomEventMessage) => {
  const receiptSummary = message.receiptSummary;

  if (!receiptSummary) {
    return null;
  }

  if (receiptSummary.recipientCount <= 1) {
    return receiptSummary.status === "read" ? "Read" : "Delivered";
  }

  if (receiptSummary.status === "read") {
    return `Read by ${receiptSummary.readCount}`;
  }

  return `Delivered to ${receiptSummary.recipientCount}`;
};

const renderMessageContent = (content: string, isOwnMessage: boolean) => {
  const parts = content.split(AI_MENTION_PATTERN);
  const mentions = content.match(AI_MENTION_PATTERN) ?? [];

  return (
    <p className="whitespace-pre-wrap break-words text-sm leading-6">
      {parts.map((part, index) => (
        <span key={`${part}-${index}`}>
          {part}
          {mentions[index] ? (
            <span
              className={cn(
                "font-semibold",
                isOwnMessage
                  ? "text-primary-foreground/90"
                  : "text-sky-700 dark:text-sky-300",
              )}
            >
              {mentions[index]}
            </span>
          ) : null}
        </span>
      ))}
    </p>
  );
};

const getImageAttachments = (message: RoomEventMessage) => {
  const attachments =
    message.attachments?.filter(
      (
        attachment,
      ): attachment is Extract<MessageAttachment, { kind: "image" }> =>
        attachment.kind === "image",
    ) ?? [];

  if (attachments.length > 0) {
    return attachments;
  }

  return message.imageUrl
    ? [
        {
          kind: "image" as const,
          url: message.imageUrl,
          mimeType: "image/*",
        },
      ]
    : [];
};

const getAudioAttachment = (message: RoomEventMessage) => {
  const attachment = message.attachments?.find(
    (candidate): candidate is Extract<MessageAttachment, { kind: "audio" }> =>
      candidate.kind === "audio",
  );

  if (attachment) {
    return attachment;
  }

  return message.audioUrl
    ? {
        kind: "audio" as const,
        url: message.audioUrl,
        mimeType: "audio/*",
        transcript: message.audioTranscript,
      }
    : null;
};

const MessageBubble = ({
  message,
  isOwnMessage,
  currentUserId,
}: {
  message: RoomEventMessage;
  isOwnMessage: boolean;
  currentUserId: string;
}) => {
  const senderName =
    message.sender === "ai"
      ? "Kochat AI"
      : message.senderUser?.name ||
        message.senderUser?.username ||
        "Unknown user";
  const senderProfileHref =
    message.sender === "human" && message.senderUser?.id
      ? message.senderUser.id === currentUserId
        ? "/profile"
        : `/users/${message.senderUser.id}`
      : null;
  const imageAttachments = getImageAttachments(message);
  const audioAttachment = getAudioAttachment(message);
  const hasAttachments =
    imageAttachments.length > 0 || Boolean(audioAttachment);
  const aiMark = (
    <span className="relative inline-flex size-7 items-center justify-center overflow-hidden rounded-full bg-[linear-gradient(135deg,rgba(12,92,255,0.95),rgba(20,184,166,0.95))] text-white shadow-sm">
      <RobotIcon size={15} weight="fill" />
    </span>
  );

  return (
    <div
      className={cn(
        "flex gap-3",
        isOwnMessage ? "justify-end" : "justify-start",
      )}
    >
      {!isOwnMessage ? (
        senderProfileHref ? (
          <Link
            href={senderProfileHref}
            className="mt-1 block transition-opacity hover:opacity-80"
          >
            <Avatar size="sm">
              <AvatarImage
                src={
                  message.sender === "human"
                    ? (message.senderUser?.image ?? undefined)
                    : undefined
                }
                alt={senderName}
              />
              <AvatarFallback
                className={cn(
                  message.sender === "ai" && "bg-transparent p-0 text-white",
                )}
              >
                {message.sender === "ai" ? aiMark : getInitials(senderName)}
              </AvatarFallback>
            </Avatar>
          </Link>
        ) : (
          <Avatar size="sm" className="mt-1">
            <AvatarImage
              src={
                message.sender === "human"
                  ? (message.senderUser?.image ?? undefined)
                  : undefined
              }
              alt={senderName}
            />
            <AvatarFallback
              className={cn(
                message.sender === "ai" && "bg-transparent p-0 text-white",
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

          {message.content
            ? renderMessageContent(message.content, isOwnMessage)
            : null}

          {imageAttachments.length > 0 ? (
            <div
              className={cn(
                "mt-3 grid gap-3",
                imageAttachments.length === 1 ? "grid-cols-1" : "grid-cols-2",
              )}
            >
              {imageAttachments.map((attachment, index) => (
                <div
                  key={`${attachment.url}-${index}`}
                  className="overflow-hidden rounded-[1rem] border border-black/5 bg-black/5 dark:border-white/10 dark:bg-white/5"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={attachment.url}
                    alt={message.content || `Shared image ${index + 1}`}
                    className="max-h-80 w-full object-cover"
                  />
                </div>
              ))}
            </div>
          ) : null}

          {audioAttachment ? (
            <div className="mt-3 rounded-[1rem] border border-black/5 bg-black/5 p-3 dark:border-white/10 dark:bg-white/5">
              <audio controls className="w-full" src={audioAttachment.url}>
                Your browser does not support audio playback.
              </audio>
            </div>
          ) : null}

          {message.messageType !== "text" || hasAttachments ? (
            <div className="mt-3">
              <Badge
                variant={isOwnMessage ? "secondary" : "outline"}
                className={cn(
                  "h-6 rounded-full px-2.5 text-[11px] uppercase tracking-[0.16em]",
                  isOwnMessage && "bg-white/15 text-primary-foreground",
                )}
              >
                {audioAttachment && imageAttachments.length > 0
                  ? "mixed"
                  : audioAttachment
                    ? "voice"
                    : imageAttachments.length > 0
                      ? imageAttachments.length > 1
                        ? "images"
                        : "image"
                      : message.messageType}
              </Badge>
            </div>
          ) : null}
        </div>

        <div
          className={cn(
            "px-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground",
            isOwnMessage ? "flex items-center justify-end gap-2" : undefined,
          )}
        >
          <span>{formatTime(message.createdAt)}</span>
          {isOwnMessage && message.sender === "human" ? (
            <span>{getReceiptLabel(message)}</span>
          ) : null}
        </div>
      </div>

      {isOwnMessage ? (
        <Link
          href="/profile"
          className="mt-1 block transition-opacity hover:opacity-80"
        >
          <Avatar size="sm">
            <AvatarImage
              src={message.senderUser?.image ?? undefined}
              alt={senderName}
            />
            <AvatarFallback>{getInitials(senderName)}</AvatarFallback>
          </Avatar>
        </Link>
      ) : null}
    </div>
  );
};

export const RoomTimeline = ({
  room,
  user,
  streamedAiText = "",
  isAiStreaming = false,
  focusedMessageId = null,
  connectionState,
  typingUsers,
  activeUsers,
  onOpenMembers,
}: RoomTimelineProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hasSnappedToLatestRef = useRef(false);
  const previousLatestMessageIdRef = useRef<string | null>(null);
  const lastMarkedReadMessageIdRef = useRef<string | null>(null);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const messagesQuery = useRoomMessages({
    roomId: room.id,
  });

  const messages = useMemo(() => {
    if (!messagesQuery.data) {
      return [];
    }

    return [...messagesQuery.data.pages]
      .reverse()
      .flatMap((page) => [...page.items].reverse());
  }, [messagesQuery.data]);
  const hasFocusedMessageLoaded = focusedMessageId
    ? messages.some((message) => message.id === focusedMessageId)
    : false

  const otherTypingUsers = typingUsers.filter(
    (typingUser) => typingUser.userId !== user.id,
  );
  const totalActiveUsers = activeUsers.some(
    (activeUser) => activeUser.userId === user.id,
  )
    ? activeUsers.length
    : activeUsers.length + 1;

  const scrollToLatest = () => {
    const viewport = containerRef.current?.querySelector<HTMLElement>(
      '[data-slot="scroll-area-viewport"]',
    );

    if (!viewport) {
      return;
    }

    viewport.scrollTo({
      top: viewport.scrollHeight,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    hasSnappedToLatestRef.current = false;
    previousLatestMessageIdRef.current = null;
    lastMarkedReadMessageIdRef.current = null;
    setIsNearBottom(true);
  }, [room.id]);

  useEffect(() => {
    const viewport = containerRef.current?.querySelector<HTMLElement>(
      '[data-slot="scroll-area-viewport"]',
    );

    if (!viewport) {
      return;
    }

    const updatePosition = () => {
      const distanceFromBottom =
        viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
      setIsNearBottom(distanceFromBottom <= 80);
    };

    updatePosition();
    viewport.addEventListener("scroll", updatePosition, { passive: true });

    return () => {
      viewport.removeEventListener("scroll", updatePosition);
    };
  }, [room.id, messages.length]);

  useEffect(() => {
    if (hasSnappedToLatestRef.current || messages.length === 0) {
      return;
    }

    const viewport = containerRef.current?.querySelector<HTMLElement>(
      '[data-slot="scroll-area-viewport"]',
    );

    if (!viewport) {
      return;
    }

    let frameId = 0;
    let resizeObserver: ResizeObserver | null = null;

    const snapToLatest = () => {
      viewport.scrollTop = viewport.scrollHeight;
    };

    frameId = requestAnimationFrame(() => {
      snapToLatest();

      // Keep the initial snap pinned while late layout changes settle
      // (for example after images/audio controls size themselves).
      resizeObserver = new ResizeObserver(() => {
        if (!hasSnappedToLatestRef.current) {
          snapToLatest();
        }
      });

      resizeObserver.observe(viewport);
      hasSnappedToLatestRef.current = true;

      requestAnimationFrame(() => {
        snapToLatest();
        resizeObserver?.disconnect();
        resizeObserver = null;
      });
    });

    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver?.disconnect();
    };
  }, [messages]);

  useEffect(() => {
    if (!focusedMessageId) {
      return;
    }

    const container = containerRef.current;

    if (!container) {
      return;
    }

    if (!hasFocusedMessageLoaded) {
      if (messagesQuery.hasNextPage && !messagesQuery.isFetchingNextPage) {
        void messagesQuery.fetchNextPage()
      }
      return;
    }

    const messageElement = container.querySelector<HTMLElement>(
      `[data-message-id="${focusedMessageId}"]`,
    );

    if (!messageElement) {
      return
    }

    messageElement.scrollIntoView({
      block: "center",
      behavior: "smooth",
    });
  }, [
    focusedMessageId,
    hasFocusedMessageLoaded,
    messagesQuery.hasNextPage,
    messagesQuery.isFetchingNextPage,
    messagesQuery.fetchNextPage,
  ]);

  useEffect(() => {
    const latestMessage = messages[messages.length - 1];

    if (!latestMessage) {
      return;
    }

    const previousLatestMessageId = previousLatestMessageIdRef.current;
    previousLatestMessageIdRef.current = latestMessage.id;

    if (
      !previousLatestMessageId ||
      previousLatestMessageId === latestMessage.id
    ) {
      return;
    }

    const shouldSnapToLatest =
      (latestMessage.sender === "human" &&
        latestMessage.senderUserId === user.id) ||
      latestMessage.sender === "ai";

    if (!shouldSnapToLatest) {
      return;
    }

    const viewport = containerRef.current?.querySelector<HTMLElement>(
      '[data-slot="scroll-area-viewport"]',
    );

    if (!viewport) {
      return;
    }

    requestAnimationFrame(() => {
      scrollToLatest();
    });
  }, [messages, user.id]);

  useEffect(() => {
    const latestMessage = messages[messages.length - 1];

    if (
      !latestMessage ||
      !isNearBottom ||
      latestMessage.id === lastMarkedReadMessageIdRef.current
    ) {
      return;
    }

    const viewport = containerRef.current?.querySelector<HTMLElement>(
      '[data-slot="scroll-area-viewport"]',
    );

    if (!viewport) {
      return;
    }

    if (document.hidden) {
      return;
    }

    lastMarkedReadMessageIdRef.current = latestMessage.id;

    void apiClient
      .post(`/rooms/${room.id}/read`, {
        messageId: latestMessage.id,
      })
      .catch(() => {
        if (lastMarkedReadMessageIdRef.current === latestMessage.id) {
          lastMarkedReadMessageIdRef.current = null;
        }
      });
  }, [isNearBottom, messages, room.id]);

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge
          variant={connectionState === "open" ? "secondary" : "outline"}
          className="h-7 rounded-full px-3"
        >
          {connectionState === "open" ? (
            <WifiHighIcon size={12} weight="bold" />
          ) : (
            <WifiSlashIcon size={12} weight="bold" />
          )}
          {getConnectionLabel(connectionState)}
        </Badge>
        <button
          type="button"
          onClick={onOpenMembers}
          className="inline-flex h-7 max-w-full items-center gap-1 rounded-full border border-border bg-background px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted"
        >
          <UsersThreeIcon size={12} weight="bold" />
          {totalActiveUsers} active
        </button>
        {otherTypingUsers.length > 0 ? (
          <Badge variant="outline" className="h-7 rounded-full px-3">
            <CircleNotchIcon size={12} className="animate-spin" />
            {otherTypingUsers
              .map((typingUser) => typingUser.userName || "Someone")
              .join(", ")}{" "}
            typing
          </Badge>
        ) : null}
      </div>

      <div
        ref={containerRef}
        className="relative min-h-0 min-w-0 flex-1 overflow-hidden rounded-[1.75rem] border border-border/60 bg-muted/20"
      >
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
                  {messagesQuery.isFetchingNextPage
                    ? "Loading..."
                    : "Load older messages"}
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
                <div
                  key={message.id}
                  data-message-id={message.id}
                  className={cn(
                    "rounded-[1.75rem] transition-[background-color,box-shadow] duration-300",
                    focusedMessageId === message.id &&
                      "bg-amber-300/15 shadow-[0_0_0_1px_rgba(245,158,11,0.28)] dark:bg-amber-400/10",
                  )}
                >
                  <MessageBubble
                    message={message}
                    isOwnMessage={
                      message.sender === "human" &&
                      message.senderUserId === user.id
                    }
                    currentUserId={user.id}
                  />
                </div>
              ))
            ) : (
              <div className="flex min-h-[340px] items-center justify-center">
                <div className="max-w-sm text-center">
                  <p className="text-lg font-semibold">No messages yet</p>
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
                  attachments: null,
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

        {!isNearBottom && messages.length > 0 ? (
          <Button
            type="button"
            size="sm"
            className="absolute bottom-4 right-4 z-10 h-10 rounded-full px-4 shadow-lg"
            onClick={scrollToLatest}
          >
            <ArrowDownIcon size={14} weight="bold" />
            Latest
          </Button>
        ) : null}
      </div>
    </div>
  );
};
