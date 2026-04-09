import { and, asc, desc, eq, ilike, inArray, isNull, lt, or, sql } from "drizzle-orm"
import { db } from "@/lib/db"
import { roomMembers, rooms, user } from "@/lib/db/schema"

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
  lastReadMessageId?: string | null
  lastReadAt?: Date | null
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

  searchForUser: async ({
    userId,
    query,
    limit = 10,
    cursorId,
  }: {
    userId: string
    query: string
    limit?: number
    cursorId?: string
  }) => {
    const cursorMembership = cursorId
      ? await db.query.roomMembers.findFirst({
          where: and(eq(roomMembers.id, cursorId), eq(roomMembers.userId, userId)),
        })
      : null

    if (cursorId && !cursorMembership) {
      throw new Error("Invalid room search cursor")
    }

    const searchTerm = `%${query}%`
    const searchPredicate = or(
      and(
        eq(rooms.type, "group"),
        or(
          ilike(rooms.name, searchTerm),
          ilike(sql`coalesce(${rooms.code}, '')`, searchTerm),
        ),
      ),
      and(
        eq(rooms.type, "dm"),
        sql<boolean>`exists (
          select 1
          from ${roomMembers} as other_members
          inner join ${user} as other_user
            on other_members.user_id = other_user.id
          where other_members.room_id = ${rooms.id}
            and other_members.archived_at is null
            and other_members.user_id <> ${userId}
            and (
              lower(coalesce(other_user.username, '')) like lower(${searchTerm})
              or lower(other_user.name) like lower(${searchTerm})
              or lower(other_user.email) like lower(${searchTerm})
            )
        )`,
      ),
    )

    const cursorPredicate = cursorMembership
      ? or(
          lt(roomMembers.joinedAt, cursorMembership.joinedAt),
          and(
            eq(roomMembers.joinedAt, cursorMembership.joinedAt),
            lt(roomMembers.id, cursorMembership.id),
          ),
        )
      : undefined

    const baseWhere = cursorPredicate
      ? and(
          eq(roomMembers.userId, userId),
          isNull(roomMembers.archivedAt),
          searchPredicate,
          cursorPredicate,
        )
      : and(eq(roomMembers.userId, userId), isNull(roomMembers.archivedAt), searchPredicate)

    const rows = await db
      .select({
        id: roomMembers.id,
      })
      .from(roomMembers)
      .innerJoin(rooms, eq(roomMembers.roomId, rooms.id))
      .where(baseWhere)
      .orderBy(desc(roomMembers.joinedAt), desc(roomMembers.id))
      .limit(limit + 1)

    const membershipIds = rows.map((row) => row.id)

    if (membershipIds.length === 0) {
      return []
    }

    const memberships = await db.query.roomMembers.findMany({
      where: inArray(roomMembers.id, membershipIds),
      with: {
        room: true,
      },
    })

    const membershipMap = new Map(
      memberships.map((membership) => [membership.id, membership]),
    )

    return membershipIds
      .map((membershipId) => membershipMap.get(membershipId))
      .filter((membership): membership is NonNullable<typeof membership> => Boolean(membership))
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

  updateMembership: async ({
    roomId,
    userId,
    archivedAt,
    role,
    lastReadMessageId,
    lastReadAt,
  }: UpdateMembershipInput) => {
    const [membership] = await db
      .update(roomMembers)
      .set({
        ...(archivedAt !== undefined ? { archivedAt } : {}),
        ...(role ? { role } : {}),
        ...(lastReadMessageId !== undefined ? { lastReadMessageId } : {}),
        ...(lastReadAt !== undefined ? { lastReadAt } : {}),
      })
      .where(and(eq(roomMembers.roomId, roomId), eq(roomMembers.userId, userId)))
      .returning()

    return membership
  },

  listActiveMembershipsByRoomId: async (roomId: string) => {
    return db.query.roomMembers.findMany({
      where: and(eq(roomMembers.roomId, roomId), isNull(roomMembers.archivedAt)),
      with: {
        user: true,
      },
      orderBy: [asc(roomMembers.joinedAt), asc(roomMembers.id)],
    })
  },

  listMembersByRoomId: async ({
    roomId,
    limit = 10,
    cursorId,
  }: {
    roomId: string
    limit?: number
    cursorId?: string
  }) => {
    const cursorMembership = cursorId
      ? await db.query.roomMembers.findFirst({
          where: and(eq(roomMembers.id, cursorId), eq(roomMembers.roomId, roomId)),
        })
      : null

    if (cursorId && !cursorMembership) {
      throw new Error("Invalid member cursor")
    }

    return db.query.roomMembers.findMany({
      where: cursorMembership
        ? and(
            eq(roomMembers.roomId, roomId),
            isNull(roomMembers.archivedAt),
            or(
              lt(roomMembers.joinedAt, cursorMembership.joinedAt),
              and(
                eq(roomMembers.joinedAt, cursorMembership.joinedAt),
                lt(roomMembers.id, cursorMembership.id),
              ),
            ),
          )
        : and(eq(roomMembers.roomId, roomId), isNull(roomMembers.archivedAt)),
      with: {
        user: true,
      },
      orderBy: [desc(roomMembers.joinedAt), desc(roomMembers.id)],
      limit: limit + 1,
    })
  },
}
