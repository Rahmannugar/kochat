import type { RoomEventMessage } from "@/lib/messages/message.client.types"

export type TypingUser = {
  userId: string
  userName: string | null
}

export type ActiveUser = {
  userId: string
  userName: string | null
  image: string | null
  lastSeenAt: string
}

export type MessageCreatedEvent = {
  roomId: string
  type: "message.created"
  payload: {
    message: RoomEventMessage
  }
  occurredAt: string
}

export type TypingUpdatedEvent = {
  roomId: string
  type: "typing.updated"
  payload: {
    typingUsers: TypingUser[]
  }
  occurredAt: string
}

export type PresenceUpdatedEvent = {
  roomId: string
  type: "presence.updated"
  payload: {
    activeUsers: ActiveUser[]
  }
  occurredAt: string
}

export type ReceiptsUpdatedEvent = {
  roomId: string
  type: "receipts.updated"
  payload: {
    userId: string
    latestReadMessageId: string
    latestReadAt: string
  }
  occurredAt: string
}

export type RoomEventPayload =
  | MessageCreatedEvent
  | TypingUpdatedEvent
  | PresenceUpdatedEvent
  | ReceiptsUpdatedEvent
