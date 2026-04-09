import { messageRepository } from "@/lib/messages/message.repository";
import { pushService } from "@/lib/push/push.service";
import { roomRepository } from "@/lib/rooms/room.repository";
import { roomEvents } from "@/lib/realtime/room-events";
import type {
  SearchMessagePage,
  RoomEventMessage,
  SearchMessageResult,
} from "@/lib/messages/message.client.types";

type CreateHumanMessageInput = {
  roomId: string;
  senderUserId: string;
  content: string;
  messageType?: "text" | "image" | "voice";
  imageUrl?: string | null;
  audioUrl?: string | null;
  audioTranscript?: string | null;
  metadata?: Record<string, unknown> | null;
};

type CreateAiMessageInput = {
  roomId: string;
  actorUserId: string;
  content: string;
  messageType?: "text" | "image" | "voice";
  imageUrl?: string | null;
  audioUrl?: string | null;
  audioTranscript?: string | null;
  metadata?: Record<string, unknown> | null;
};

const assertActiveRoomMembership = async (roomId: string, userId: string) => {
  const membership = await roomRepository.findMembership(roomId, userId);

  if (!membership || membership.archivedAt) {
    throw new Error("You do not have access to this room");
  }

  return membership;
};

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

const hasMemberReadMessage = (
  membership: {
    lastReadAt: Date | null
    lastReadMessageId: string | null
  },
  message: {
    id: string
    createdAt: string | Date
  },
) => {
  if (!membership.lastReadAt) {
    return false
  }

  const messageCreatedAt =
    message.createdAt instanceof Date ? message.createdAt : new Date(message.createdAt)

  if (membership.lastReadAt.getTime() > messageCreatedAt.getTime()) {
    return true
  }

  return (
    membership.lastReadAt.getTime() === messageCreatedAt.getTime() &&
    membership.lastReadMessageId === message.id
  )
}

const attachReceiptSummary = (
  message: RoomEventMessage,
  memberships: Array<{
    userId: string
    lastReadAt: Date | null
    lastReadMessageId: string | null
  }>,
): RoomEventMessage => {
  if (message.sender !== "human" || !message.senderUserId) {
    return {
      ...message,
      receiptSummary: null,
    }
  }

  const recipientMemberships = memberships.filter(
    (membership) => membership.userId !== message.senderUserId,
  )
  const recipientCount = recipientMemberships.length
  const readCount = recipientMemberships.filter((membership) =>
    hasMemberReadMessage(membership, message),
  ).length

  return {
    ...message,
    receiptSummary: {
      recipientCount,
      readCount,
      status:
        recipientCount === 0
          ? "sent"
          : readCount === recipientCount
            ? "read"
            : "delivered",
    },
  }
}

const buildMatchPreview = (
  field: "content" | "audioTranscript",
  text: string | null,
  query: string,
) => {
  if (!text) {
    return null
  }

  const normalizedText = text.trim()

  if (!normalizedText) {
    return null
  }

  const matcher = new RegExp(escapeRegExp(query), "i")
  const match = matcher.exec(normalizedText)

  if (!match || match.index === undefined) {
    return null
  }

  const contextRadius = 48
  const start = Math.max(0, match.index - contextRadius)
  const end = Math.min(normalizedText.length, match.index + match[0].length + contextRadius)

  return {
    field,
    text: normalizedText,
    before: normalizedText.slice(start, match.index),
    match: match[0],
    after: normalizedText.slice(match.index + match[0].length, end),
  }
}

export const messageService = {
  listRoomMessages: async ({
    roomId,
    userId,
    limit = 30,
    cursor,
  }: {
    roomId: string;
    userId: string;
    limit?: number;
    cursor?: string;
  }) => {
    await assertActiveRoomMembership(roomId, userId);

    const page = await messageRepository.listPageByRoomId({
      roomId,
      limit,
      cursorId: cursor,
    });
    const memberships = await roomRepository.listActiveMembershipsByRoomId(roomId)

    const hasNextPage = page.length > limit;
    const items = (hasNextPage ? page.slice(0, limit) : page).map((message) =>
      attachReceiptSummary(message, memberships),
    );
    const nextCursor = hasNextPage ? (items.at(-1)?.id ?? null) : null;

    return {
      items,
      pageInfo: {
        hasNextPage,
        nextCursor,
      },
    };
  },

  searchRoomMessages: async (
    roomId: string,
    userId: string,
    query: string,
    limit = 20,
    cursor?: string,
  ): Promise<SearchMessagePage> => {
    await assertActiveRoomMembership(roomId, userId);

    const normalizedQuery = query.trim()
    const memberships = await roomRepository.listActiveMembershipsByRoomId(roomId)
    const page = await messageRepository.searchByRoomId({
      roomId,
      query: normalizedQuery,
      limit,
      cursorId: cursor,
    })
    const hasNextPage = page.length > limit
    const items = hasNextPage ? page.slice(0, limit) : page

    const results = items
      .map((message) => attachReceiptSummary(message, memberships))
      .map<SearchMessageResult | null>((message) => {
        const matches = [
          buildMatchPreview("content", message.content, normalizedQuery),
          buildMatchPreview("audioTranscript", message.audioTranscript, normalizedQuery),
        ].filter((value): value is NonNullable<typeof value> => Boolean(value))

        if (matches.length === 0) {
          return null
        }

        return {
          message,
          matches,
        }
      })
      .filter((value): value is SearchMessageResult => Boolean(value))

    return {
      items: results,
      pageInfo: {
        hasNextPage,
        nextCursor: hasNextPage ? (items.at(-1)?.id ?? null) : null,
      },
    }
  },

  createHumanMessage: async ({
    roomId,
    senderUserId,
    content,
    messageType,
    imageUrl,
    audioUrl,
    audioTranscript,
    metadata,
  }: CreateHumanMessageInput) => {
    await assertActiveRoomMembership(roomId, senderUserId);

    const createdMessage = await messageRepository.create({
      roomId,
      sender: "human",
      senderUserId,
      content,
      messageType,
      imageUrl,
      audioUrl,
      audioTranscript,
      metadata,
    });

    const message = await messageRepository.findDetailedById(createdMessage.id);
    const memberships = await roomRepository.listActiveMembershipsByRoomId(roomId)
    const room = await roomRepository.findById(roomId)

    if (!message) {
      throw new Error("Message could not be loaded after creation");
    }

    const enrichedMessage = attachReceiptSummary(message, memberships)

    await roomEvents.publish({
      roomId,
      type: "message.created",
      payload: {
        message: enrichedMessage,
      },
    });

    await pushService.notifyRoomMembersAboutMessage({
      roomId,
      senderUserId,
      senderName:
        enrichedMessage.senderUser?.name ??
        enrichedMessage.senderUser?.username ??
        "New message",
      roomName: room?.name ?? "Kochat",
      preview:
        enrichedMessage.content.trim() ||
        (enrichedMessage.messageType === "image"
          ? "Sent an image"
          : enrichedMessage.messageType === "voice"
            ? "Sent a voice note"
            : "Sent a message"),
    })

    return enrichedMessage;
  },

  createAiMessage: async ({
    roomId,
    actorUserId,
    content,
    messageType,
    imageUrl,
    audioUrl,
    audioTranscript,
    metadata,
  }: CreateAiMessageInput) => {
    await assertActiveRoomMembership(roomId, actorUserId);

    const createdMessage = await messageRepository.create({
      roomId,
      sender: "ai",
      content,
      messageType,
      imageUrl,
      audioUrl,
      audioTranscript,
      metadata,
    });

    const message = await messageRepository.findDetailedById(createdMessage.id);
    const memberships = await roomRepository.listActiveMembershipsByRoomId(roomId)

    if (!message) {
      throw new Error("AI message could not be loaded after creation");
    }

    const enrichedMessage = attachReceiptSummary(message, memberships)

    await roomEvents.publish({
      roomId,
      type: "message.created",
      payload: {
        message: enrichedMessage,
      },
    });

    return enrichedMessage;
  },

  markRoomRead: async ({
    roomId,
    userId,
    messageId,
  }: {
    roomId: string
    userId: string
    messageId: string
  }) => {
    const membership = await assertActiveRoomMembership(roomId, userId)
    const message = await messageRepository.findById(messageId)

    if (!message || message.roomId !== roomId) {
      throw new Error("Message not found in this room")
    }

    const nextReadAt = message.createdAt
    const currentReadAt = membership.lastReadAt

    if (
      currentReadAt &&
      (currentReadAt.getTime() > nextReadAt.getTime() ||
        (currentReadAt.getTime() === nextReadAt.getTime() &&
          membership.lastReadMessageId === message.id))
    ) {
      return {
        latestReadMessageId: membership.lastReadMessageId,
        latestReadAt: currentReadAt.toISOString(),
      }
    }

    await roomRepository.updateMembership({
      roomId,
      userId,
      lastReadMessageId: message.id,
      lastReadAt: nextReadAt,
    })

    await roomEvents.publish({
      roomId,
      type: "receipts.updated",
      payload: {
        userId,
        latestReadMessageId: message.id,
        latestReadAt: nextReadAt.toISOString(),
      },
    })

    return {
      latestReadMessageId: message.id,
      latestReadAt: nextReadAt.toISOString(),
    }
  },
};
