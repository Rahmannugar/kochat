import { roomRepository } from "@/lib/repositories/room.repository"

export const GENERAL_ROOM_SLUG = "general"

const createId = () => crypto.randomUUID()

export const roomService = {
  ensureGeneralRoom: async () => {
    const existingRoom = await roomRepository.findBySlug(GENERAL_ROOM_SLUG)

    if (existingRoom) {
      return existingRoom
    }

    return roomRepository.createRoom({
      id: createId(),
      slug: GENERAL_ROOM_SLUG,
      name: "General",
      description: "Default workspace room for every newly registered member",
      kind: "channel",
      isDefault: true,
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
}
