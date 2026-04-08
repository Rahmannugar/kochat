import { and, desc, eq, isNull, lt, or } from "drizzle-orm"
import { db } from "@/lib/db"
import { roomMembers, rooms } from "@/lib/db/schema"

type CreateRoomInput = {
  name: string
  description?: string
  type: "dm" | "group"
  code?: string | null
  dmKey?: string | null
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

  findByDmKey: async (dmKey: string) => {
    return db.query.rooms.findFirst({
      where: eq(rooms.dmKey, dmKey),
    })
  },

  create: async ({ name, description, type, code, dmKey, createdBy }: CreateRoomInput) => {
    const [room] = await db
      .insert(rooms)
      .values({
        name,
        description,
        type,
        code: code ?? null,
        dmKey: dmKey ?? null,
        createdBy,
      })
      .returning()

    return room
  },

  createDirectRoom: async ({ name, dmKey, createdBy }: { name: string; dmKey: string; createdBy: string }) => {
    const [room] = await db
      .insert(rooms)
      .values({
        name,
        type: "dm",
        dmKey,
        createdBy,
      })
      .onConflictDoNothing()
      .returning()

    if (room) {
      return room
    }

    return db.query.rooms.findFirst({
      where: eq(rooms.dmKey, dmKey),
    })
  },

  listForUser: async ({
    userId,
    limit = 10,
    cursorId,
  }: {
    userId: string
    limit?: number
    cursorId?: string
  }) => {
    const cursorMembership = cursorId
      ? await db.query.roomMembers.findFirst({
          where: and(eq(roomMembers.id, cursorId), eq(roomMembers.userId, userId)),
        })
      : null

    if (cursorId && !cursorMembership) {
      throw new Error("Invalid room cursor")
    }

    return db.query.roomMembers.findMany({
      where: cursorMembership
        ? and(
            eq(roomMembers.userId, userId),
            isNull(roomMembers.archivedAt),
            or(
              lt(roomMembers.joinedAt, cursorMembership.joinedAt),
              and(
                eq(roomMembers.joinedAt, cursorMembership.joinedAt),
                lt(roomMembers.id, cursorMembership.id),
              ),
            ),
          )
        : and(eq(roomMembers.userId, userId), isNull(roomMembers.archivedAt)),
      with: {
        room: true,
      },
      orderBy: [desc(roomMembers.joinedAt), desc(roomMembers.id)],
      limit: limit + 1,
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
}
