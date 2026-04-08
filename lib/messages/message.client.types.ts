export type RoomEventMessage = {
  id: string
  roomId: string
  sender: "human" | "ai"
  senderUserId: string | null
  content: string
  messageType: "text" | "image" | "voice"
  imageUrl: string | null
  audioUrl: string | null
  audioTranscript: string | null
  metadata: Record<string, unknown> | null
  createdAt: string | Date
  updatedAt: string | Date
  receiptSummary?: {
    recipientCount: number
    readCount: number
    status: "sent" | "delivered" | "read"
  } | null
  senderUser?: {
    id: string
    name: string | null
    image: string | null
    username?: string | null
  } | null
}

export type PaginatedMessages = {
  items: RoomEventMessage[]
  pageInfo: {
    hasNextPage: boolean
    nextCursor: string | null
  }
}

export type SearchMessageMatch = {
  field: "content" | "audioTranscript"
  text: string
  before: string
  match: string
  after: string
}

export type SearchMessageResult = {
  message: RoomEventMessage
  matches: SearchMessageMatch[]
}

export type SearchMessagePage = {
  items: SearchMessageResult[]
  pageInfo: {
    hasNextPage: boolean
    nextCursor: string | null
  }
}
