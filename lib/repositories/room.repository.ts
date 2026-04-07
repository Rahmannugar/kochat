import { and, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { roomMembers, rooms } from "@/lib/db/schema"

type CreateRoomInput = {
  id: string
  slug: string
  name: string
  description?: string
  kind?: "channel" | "group" | "dm"
  isDefault?: boolean
  createdBy?: string
}

type AddMemberInput = {
  id: string
  roomId: string
  userId: string
  role?: "owner" | "member"
}

export const roomRepository = {
  findBySlug: async (slug: string) => {
    return db.query.rooms.findFirst({
      where: eq(rooms.slug, slug),
    })
  },

  createRoom: async ({
    id,
    slug,
    name,
    description,
    kind = "channel",
    isDefault = false,
    createdBy,
  }: CreateRoomInput) => {
    const [room] = await db
      .insert(rooms)
      .values({
        id,
        slug,
        name,
        description,
        kind,
        isDefault,
        createdBy,
      })
      .returning()

    return room
  },

  findMembership: async (roomId: string, userId: string) => {
    return db.query.roomMembers.findFirst({
      where: and(eq(roomMembers.roomId, roomId), eq(roomMembers.userId, userId)),
    })
  },

  addMember: async ({ id, roomId, userId, role = "member" }: AddMemberInput) => {
    const [member] = await db
      .insert(roomMembers)
      .values({
        id,
        roomId,
        userId,
        role,
      })
      .onConflictDoNothing()
      .returning()

    if (member) {
      return member
    }

    return db.query.roomMembers.findFirst({
      where: and(eq(roomMembers.roomId, roomId), eq(roomMembers.userId, userId)),
    })
  },
}
