import { roomRepository } from "@/lib/repositories/room.repository"

export const GENERAL_ROOM_CODE_PREFIX = "GR"

const createId = () => crypto.randomUUID()
const createSecureCode = () => crypto.randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase()

export const roomService = {
  ensureGeneralRoom: async () => {
    const existingRoom = await roomRepository.findGeneralRoom()

    if (existingRoom) {
      return existingRoom
    }

    return roomRepository.createRoom({
      id: createId(),
      name: "General",
      description: "Default workspace room for every newly registered member",
      type: "general",
    })
  },

  ensureMembership: async (roomId: string, userId: string, role: "owner" | "member" = "member") => {
    const existingMembership = await roomRepository.findMembership(roomId, userId)

    if (existingMembership) {
      return existingMembership
    }

    return roomRepository.addMember({
      id: createId(),
      roomId,
      userId,
      role,
    })
  },

  createGroupRoom: async ({
    name,
    description,
    createdBy,
  }: {
    name: string
    description?: string
    createdBy: string
  }) => {
    const code = `${GENERAL_ROOM_CODE_PREFIX}-${createSecureCode()}`

    const room = await roomRepository.createRoom({
      id: createId(),
      name,
      description,
      type: "group",
      code,
      createdBy,
    })

    await roomRepository.addMember({
      id: createId(),
      roomId: room.id,
      userId: createdBy,
      role: "owner",
    })

    return room
  },

  findOrCreateDirectRoom: async (currentUserId: string, targetUserId: string) => {
    const existingRoom = await roomRepository.findDirectRoomForUsers([currentUserId, targetUserId])

    if (existingRoom) {
      await Promise.all([
        roomRepository.restoreMembership(existingRoom.id, currentUserId),
        roomRepository.restoreMembership(existingRoom.id, targetUserId),
      ])

      return existingRoom
    }

    const room = await roomRepository.createRoom({
      id: createId(),
      name: "Direct Message",
      type: "dm",
      createdBy: currentUserId,
    })

    await Promise.all([
      roomRepository.addMember({
        id: createId(),
        roomId: room.id,
        userId: currentUserId,
        role: "owner",
      }),
      roomRepository.addMember({
        id: createId(),
        roomId: room.id,
        userId: targetUserId,
      }),
    ])

    return room
  },
}
