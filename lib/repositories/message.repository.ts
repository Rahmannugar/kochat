import { and, asc, desc, eq, ilike, or } from "drizzle-orm"
import { db } from "@/lib/db"
import { messages } from "@/lib/db/schema"

type CreateMessageInput = {
  id: string
  roomId: string
  sender: "human" | "ai"
  senderUserId?: string | null
  content: string
  messageType?: "text" | "image" | "voice"
  imageUrl?: string | null
  audioUrl?: string | null
  audioTranscript?: string | null
  metadata?: Record<string, unknown> | null
}

export const messageRepository = {
  findById: async (messageId: string) => {
    return db.query.messages.findFirst({
      where: eq(messages.id, messageId),
    })
  },

  create: async ({
    id,
    roomId,
    sender,
    senderUserId,
    content,
    messageType = "text",
    imageUrl,
    audioUrl,
    audioTranscript,
    metadata,
  }: CreateMessageInput) => {
    const [message] = await db
      .insert(messages)
      .values({
        id,
        roomId,
        sender,
        senderUserId: senderUserId ?? null,
        content,
        messageType,
        imageUrl: imageUrl ?? null,
        audioUrl: audioUrl ?? null,
        audioTranscript: audioTranscript ?? null,
        metadata: metadata ?? null,
      })
      .returning()

    return message
  },

  listByRoomId: async (roomId: string, limit = 30) => {
    return db.query.messages.findMany({
      where: eq(messages.roomId, roomId),
      with: {
        senderUser: true,
      },
      orderBy: desc(messages.createdAt),
      limit,
    })
  },

  listRecentByRoomId: async (roomId: string, limit = 20) => {
    return db.query.messages.findMany({
      where: eq(messages.roomId, roomId),
      with: {
        senderUser: true,
      },
      orderBy: asc(messages.createdAt),
      limit,
    })
  },

  searchByRoomId: async (roomId: string, query: string, limit = 20) => {
    return db.query.messages.findMany({
      where: and(
        eq(messages.roomId, roomId),
        or(
          ilike(messages.content, `%${query}%`),
          ilike(messages.audioTranscript, `%${query}%`),
        ),
      ),
      with: {
        senderUser: true,
      },
      orderBy: desc(messages.createdAt),
      limit,
    })
  },
}
