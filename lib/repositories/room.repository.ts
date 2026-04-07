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
import { and, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { roomMembers, rooms } from "@/lib/db/schema"

type CreateRoomInput = {
  id: string
  name: string
  description?: string
  type?: "general" | "group" | "dm"
  code?: string | null
  createdBy?: string
}

type AddMemberInput = {
  id: string
  roomId: string
  userId: string
  role?: "owner" | "member"
}

export const roomRepository = {
  findByCode: async (code: string) => {
    return db.query.rooms.findFirst({
      where: eq(rooms.code, code),
    })
  },

  findGeneralRoom: async () => {
    return db.query.rooms.findFirst({
      where: eq(rooms.type, "general"),
    })
  },

  createRoom: async ({
    id,
    name,
    description,
    type = "group",
    code,
    createdBy,
  }: CreateRoomInput) => {
    const [room] = await db
      .insert(rooms)
      .values({
        id,
        name,
        description,
        type,
        code: code ?? null,
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

  restoreMembership: async (roomId: string, userId: string) => {
    const [membership] = await db
      .update(roomMembers)
      .set({
        archivedAt: null,
      })
      .where(and(eq(roomMembers.roomId, roomId), eq(roomMembers.userId, userId)))
      .returning()

    return membership
  },

  findDirectRoomForUsers: async (userIds: [string, string]) => {
    const directRooms = await db.query.rooms.findMany({
      where: eq(rooms.type, "dm"),
      with: {
        members: true,
      },
    })

    return directRooms.find((room) => {
      const roomUserIds = room.members.map((member) => member.userId).sort()
      const sortedTargetUserIds = [...userIds].sort()

      return roomUserIds.length === 2 && roomUserIds[0] === sortedTargetUserIds[0] && roomUserIds[1] === sortedTargetUserIds[1]
    })
  },
}
