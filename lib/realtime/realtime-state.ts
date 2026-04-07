import { roomEvents } from "@/lib/realtime/room-events"

const TYPING_TTL_MS = 4_000
const PRESENCE_TTL_MS = 30_000

type TypingEntry = {
  userId: string
  userName: string | null
  expiresAt: number
}

type PresenceEntry = {
  userId: string
  userName: string | null
  image: string | null
  lastSeenAt: number
}

const typingByRoom = new Map<string, Map<string, TypingEntry>>()
const presenceByRoom = new Map<string, Map<string, PresenceEntry>>()

const now = () => Date.now()

const getTypingSnapshot = (roomId: string) => {
  const roomTyping = typingByRoom.get(roomId)

  if (!roomTyping) {
    return []
  }

  const currentTime = now()
  const activeEntries = [...roomTyping.values()].filter(
    (entry) => entry.expiresAt > currentTime,
  )

  if (activeEntries.length === 0) {
    typingByRoom.delete(roomId)
    return []
  }

  return activeEntries.map(({ userId, userName }) => ({
    userId,
    userName,
  }))
}

const getPresenceSnapshot = (roomId: string) => {
  const roomPresence = presenceByRoom.get(roomId)

  if (!roomPresence) {
    return []
  }

  const currentTime = now()
  const activeEntries = [...roomPresence.values()].filter(
    (entry) => currentTime - entry.lastSeenAt <= PRESENCE_TTL_MS,
  )

  if (activeEntries.length === 0) {
    presenceByRoom.delete(roomId)
    return []
  }

  return activeEntries.map(({ userId, userName, image, lastSeenAt }) => ({
    userId,
    userName,
    image,
    lastSeenAt: new Date(lastSeenAt).toISOString(),
  }))
}

const scheduleTypingExpiry = (roomId: string, userId: string) => {
  setTimeout(async () => {
    const roomTyping = typingByRoom.get(roomId)

    if (!roomTyping) {
      return
    }

    const entry = roomTyping.get(userId)

    if (!entry || entry.expiresAt > now()) {
      return
    }

    roomTyping.delete(userId)

    if (roomTyping.size === 0) {
      typingByRoom.delete(roomId)
    }

    await roomEvents.publish({
      roomId,
      type: "typing.updated",
      payload: {
        typingUsers: getTypingSnapshot(roomId),
      },
    })
  }, TYPING_TTL_MS + 100)
}

export const realtimeState = {
  getRoomSnapshot: (roomId: string) => ({
    typingUsers: getTypingSnapshot(roomId),
    activeUsers: getPresenceSnapshot(roomId),
  }),

  updateTyping: async ({
    roomId,
    userId,
    userName,
    isTyping,
  }: {
    roomId: string
    userId: string
    userName: string | null
    isTyping: boolean
  }) => {
    const roomTyping = typingByRoom.get(roomId) ?? new Map<string, TypingEntry>()

    if (isTyping) {
      roomTyping.set(userId, {
        userId,
        userName,
        expiresAt: now() + TYPING_TTL_MS,
      })
      typingByRoom.set(roomId, roomTyping)
      scheduleTypingExpiry(roomId, userId)
    } else {
      roomTyping.delete(userId)

      if (roomTyping.size === 0) {
        typingByRoom.delete(roomId)
      } else {
        typingByRoom.set(roomId, roomTyping)
      }
    }

    const snapshot = getTypingSnapshot(roomId)

    await roomEvents.publish({
      roomId,
      type: "typing.updated",
      payload: {
        typingUsers: snapshot,
      },
    })

    return snapshot
  },

  updatePresence: async ({
    roomId,
    userId,
    userName,
    image,
    active,
  }: {
    roomId: string
    userId: string
    userName: string | null
    image: string | null
    active: boolean
  }) => {
    const roomPresence = presenceByRoom.get(roomId) ?? new Map<string, PresenceEntry>()

    if (active) {
      roomPresence.set(userId, {
        userId,
        userName,
        image,
        lastSeenAt: now(),
      })
      presenceByRoom.set(roomId, roomPresence)
    } else {
      roomPresence.delete(userId)

      if (roomPresence.size === 0) {
        presenceByRoom.delete(roomId)
      } else {
        presenceByRoom.set(roomId, roomPresence)
      }
    }

    const snapshot = getPresenceSnapshot(roomId)

    await roomEvents.publish({
      roomId,
      type: "presence.updated",
      payload: {
        activeUsers: snapshot,
      },
    })

    return snapshot
  },
}
