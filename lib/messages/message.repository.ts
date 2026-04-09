import type { MessageAttachment } from "@/lib/messages/message.client.types"
import { and, desc, eq, ilike, lt, or } from "drizzle-orm"
import { db } from "@/lib/db"
import { messages } from "@/lib/db/schema"

type CreateMessageInput = {
  roomId: string
  sender: "human" | "ai"
  senderUserId?: string | null
  content: string
  messageType?: "text" | "image" | "voice"
  imageUrl?: string | null
  audioUrl?: string | null
  audioTranscript?: string | null
  attachments?: MessageAttachment[] | null
  metadata?: Record<string, unknown> | null
}

export const messageRepository = {
  findById: async (messageId: string) => {
    return db.query.messages.findFirst({
      where: eq(messages.id, messageId),
    })
  },

  findDetailedById: async (messageId: string) => {
    return db.query.messages.findFirst({
      where: eq(messages.id, messageId),
      with: {
        senderUser: true,
      },
    })
  },

  create: async ({
    roomId,
    sender,
    senderUserId,
    content,
    messageType = "text",
    imageUrl,
    audioUrl,
    audioTranscript,
    attachments,
    metadata,
  }: CreateMessageInput) => {
    const [message] = await db
      .insert(messages)
      .values({
        roomId,
        sender,
        senderUserId: senderUserId ?? null,
        content,
        messageType,
        imageUrl: imageUrl ?? null,
        audioUrl: audioUrl ?? null,
        audioTranscript: audioTranscript ?? null,
        attachments: attachments ?? null,
        metadata: metadata ?? null,
      })
      .returning()

    return message
  },

  listRecentByRoomId: async (roomId: string, limit = 20) => {
    const rows = await db.query.messages.findMany({
      where: eq(messages.roomId, roomId),
      with: {
        senderUser: true,
      },
      orderBy: [desc(messages.createdAt), desc(messages.id)],
      limit,
    })

    return rows.reverse()
  },

  listPageByRoomId: async ({
    roomId,
    limit,
    cursorId,
  }: {
    roomId: string
    limit: number
    cursorId?: string
  }) => {
    const cursorMessage = cursorId ? await db.query.messages.findFirst({
      where: eq(messages.id, cursorId),
    }) : null

    if (cursorId && (!cursorMessage || cursorMessage.roomId !== roomId)) {
      throw new Error("Invalid message cursor")
    }

    const page = await db.query.messages.findMany({
      where: cursorMessage
        ? and(
            eq(messages.roomId, roomId),
            or(
              lt(messages.createdAt, cursorMessage.createdAt),
              and(
                eq(messages.createdAt, cursorMessage.createdAt),
                lt(messages.id, cursorMessage.id),
              ),
            ),
          )
        : eq(messages.roomId, roomId),
      with: {
        senderUser: true,
      },
      orderBy: [desc(messages.createdAt), desc(messages.id)],
      limit: limit + 1,
    })

    return page
  },

  searchByRoomId: async ({
    roomId,
    query,
    limit = 20,
    cursorId,
  }: {
    roomId: string
    query: string
    limit?: number
    cursorId?: string
  }) => {
    const cursorMessage = cursorId
      ? await db.query.messages.findFirst({
          where: eq(messages.id, cursorId),
        })
      : null

    if (cursorId && (!cursorMessage || cursorMessage.roomId !== roomId)) {
      throw new Error("Invalid search cursor")
    }

    const baseSearchPredicate = and(
      eq(messages.roomId, roomId),
      or(
        ilike(messages.content, `%${query}%`),
        ilike(messages.audioTranscript, `%${query}%`),
      ),
    )

    const cursorPredicate = cursorMessage
      ? or(
          lt(messages.createdAt, cursorMessage.createdAt),
          and(
            eq(messages.createdAt, cursorMessage.createdAt),
            lt(messages.id, cursorMessage.id),
          ),
        )
      : undefined

    return db.query.messages.findMany({
      where: cursorPredicate ? and(baseSearchPredicate, cursorPredicate) : baseSearchPredicate,
      with: {
        senderUser: true,
      },
      orderBy: [desc(messages.createdAt), desc(messages.id)],
      limit: limit + 1,
    })
  },
}
