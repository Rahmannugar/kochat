import { roomService } from "@/lib/services/room.service"
import { userRepository } from "@/lib/repositories/user.repository"

type BootstrapUserInput = {
  id: string
  name: string
  image?: string | null
}

export const authService = {
  bootstrapWorkspaceForUser: async ({ id, name, image }: BootstrapUserInput) => {
    const profile = await userRepository.upsertProfile({
      userId: id,
      displayName: name,
      avatarUrl: image ?? null,
    })

    const generalRoom = await roomService.ensureGeneralRoom()
    const membership = await roomService.ensureMembership(generalRoom.id, id)

    return {
      profile,
      generalRoom,
      membership,
    }
  },
}
