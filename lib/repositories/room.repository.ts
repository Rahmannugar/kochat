import { and, desc, eq, inArray, isNull } from "drizzle-orm"
import { db } from "@/lib/db"
import { roomMembers, rooms } from "@/lib/db/schema"

type CreateRoomInput = {
  name: string
  description?: string
  type: "dm" | "group"
  code?: string | null
  createdBy?: string
}

type AddMembershipInput = {
  roomId: string
  userId: string
  role?: "owner" | "member"
}

type UpdateMembershipInput = {
  roomId: string
  userId: string
  archivedAt?: Date | null
  role?: "owner" | "member"
}

export const roomRepository = {
  findById: async (roomId: string) => {
    return db.query.rooms.findFirst({
      where: eq(rooms.id, roomId),
    })
  },

  findByCode: async (code: string) => {
    return db.query.rooms.findFirst({
      where: eq(rooms.code, code),
    })
  },

  create: async ({ name, description, type, code, createdBy }: CreateRoomInput) => {
    const [room] = await db
      .insert(rooms)
      .values({
        name,
        description,
        type,
        code: code ?? null,
        createdBy,
      })
      .returning()

    return room
  },

  listForUser: async (userId: string) => {
    return db.query.roomMembers.findMany({
      where: and(eq(roomMembers.userId, userId), isNull(roomMembers.archivedAt)),
      with: {
        room: true,
      },
      orderBy: desc(roomMembers.joinedAt),
    })
  },

  findMembership: async (roomId: string, userId: string) => {
    return db.query.roomMembers.findFirst({
      where: and(eq(roomMembers.roomId, roomId), eq(roomMembers.userId, userId)),
    })
  },

  addMembership: async ({
    roomId,
    userId,
    role = "member",
  }: AddMembershipInput) => {
    const [membership] = await db
      .insert(roomMembers)
      .values({
        roomId,
        userId,
        role,
      })
      .onConflictDoNothing()
      .returning()

    if (membership) {
      return membership
    }

    return db.query.roomMembers.findFirst({
      where: and(eq(roomMembers.roomId, roomId), eq(roomMembers.userId, userId)),
    })
  },

  updateMembership: async ({ roomId, userId, archivedAt, role }: UpdateMembershipInput) => {
    const [membership] = await db
      .update(roomMembers)
      .set({
        ...(archivedAt !== undefined ? { archivedAt } : {}),
        ...(role ? { role } : {}),
      })
      .where(and(eq(roomMembers.roomId, roomId), eq(roomMembers.userId, userId)))
      .returning()

    return membership
  },

  listMembersByRoomId: async (roomId: string) => {
    return db.query.roomMembers.findMany({
      where: eq(roomMembers.roomId, roomId),
      with: {
        user: true,
      },
    })
  },

  listDirectRoomCandidatesForUsers: async (userIds: [string, string]) => {
    const memberships = await db.query.roomMembers.findMany({
      where: inArray(roomMembers.userId, userIds),
      with: {
        room: true,
      },
    })

    const candidateRoomIds = [...new Set(
      memberships
        .filter((membership) => membership.room.type === "dm")
        .map((membership) => membership.roomId),
    )]

    if (candidateRoomIds.length === 0) {
      return []
    }

    return db.query.rooms.findMany({
      where: inArray(rooms.id, candidateRoomIds),
      with: {
        members: true,
      },
    })
  },
}
