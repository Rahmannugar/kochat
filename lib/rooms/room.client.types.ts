export type RoomListItem = {
  id: string
  roomId: string
  userId: string
  role: "owner" | "member"
  archivedAt: string | Date | null
  joinedAt: string | Date
  room: {
    id: string
    name: string
    description: string | null
    type: "dm" | "group"
    code: string | null
    dmKey: string | null
    createdBy: string | null
    createdAt: string | Date
    updatedAt: string | Date
  }
}

export type RoomListPage = {
  items: RoomListItem[]
  pageInfo: {
    hasNextPage: boolean
    nextCursor: string | null
  }
}

export type RoomMemberListItem = {
  id: string
  roomId: string
  userId: string
  role: "owner" | "member"
  archivedAt: string | Date | null
  joinedAt: string | Date
  user: {
    id: string
    name: string
    email: string
    username: string | null
    image: string | null
  }
}

export type RoomMemberPage = {
  items: RoomMemberListItem[]
  pageInfo: {
    hasNextPage: boolean
    nextCursor: string | null
  }
}
