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
