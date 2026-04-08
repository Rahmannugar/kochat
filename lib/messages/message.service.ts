import { messageRepository } from "@/lib/messages/message.repository";
import { roomRepository } from "@/lib/rooms/room.repository";
import { roomEvents } from "@/lib/realtime/room-events";
import type { SearchMessageResult } from "@/lib/messages/message.client.types";

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

    const hasNextPage = page.length > limit;
    const items = hasNextPage ? page.slice(0, limit) : page;
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
  ): Promise<SearchMessageResult[]> => {
    await assertActiveRoomMembership(roomId, userId);

    const normalizedQuery = query.trim()
    const messages = await messageRepository.searchByRoomId(roomId, normalizedQuery, limit)

    return messages
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

    if (!message) {
      throw new Error("Message could not be loaded after creation");
    }

    await roomEvents.publish({
      roomId,
      type: "message.created",
      payload: {
        message,
      },
    });

    return message;
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

    if (!message) {
      throw new Error("AI message could not be loaded after creation");
    }

    await roomEvents.publish({
      roomId,
      type: "message.created",
      payload: {
        message,
      },
    });

    return message;
  },
};
