import { messageRepository } from "@/lib/repositories/message.repository"
import { roomRepository } from "@/lib/repositories/room.repository"

type CreateHumanMessageInput = {
  roomId: string
  senderUserId: string
  content: string
  messageType?: "text" | "image" | "voice"
  imageUrl?: string | null
  audioUrl?: string | null
  audioTranscript?: string | null
  metadata?: Record<string, unknown> | null
}

type CreateAiMessageInput = {
  roomId: string
  actorUserId: string
  content: string
  messageType?: "text" | "image" | "voice"
  imageUrl?: string | null
  audioUrl?: string | null
  audioTranscript?: string | null
  metadata?: Record<string, unknown> | null
}

const assertActiveRoomMembership = async (roomId: string, userId: string) => {
  const membership = await roomRepository.findMembership(roomId, userId)

  if (!membership || membership.archivedAt) {
    throw new Error("You do not have access to this room")
  }

  return membership
}

export const messageService = {
  listRoomMessages: async (roomId: string, userId: string, limit = 30) => {
    await assertActiveRoomMembership(roomId, userId)

    return messageRepository.listByRoomId(roomId, limit)
  },

  searchRoomMessages: async (roomId: string, userId: string, query: string, limit = 20) => {
    await assertActiveRoomMembership(roomId, userId)

    return messageRepository.searchByRoomId(roomId, query.trim(), limit)
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
    await assertActiveRoomMembership(roomId, senderUserId)

    return messageRepository.create({
      roomId,
      sender: "human",
      senderUserId,
      content,
      messageType,
      imageUrl,
      audioUrl,
      audioTranscript,
      metadata,
    })
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
    await assertActiveRoomMembership(roomId, actorUserId)

    return messageRepository.create({
      roomId,
      sender: "ai",
      content,
      messageType,
      imageUrl,
      audioUrl,
      audioTranscript,
      metadata,
    })
  },
}
