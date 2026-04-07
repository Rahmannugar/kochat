import { roomService } from "@/lib/services/room.service"
import { userRepository } from "@/lib/repositories/user.repository"

type BootstrapUserInput = {
  id: string
  name: string
  email: string
  image?: string | null
}

export const authService = {
  bootstrapWorkspaceForUser: async ({ id, name, email, image }: BootstrapUserInput) => {
    const currentUser = await userRepository.findById(id)
    const fallbackUsername = email.split("@")[0]?.toLowerCase().replace(/[^a-z0-9_]/g, "") || `user_${id.slice(0, 8)}`

    const updatedUser = await userRepository.updateUserProfile({
      userId: id,
      name,
      image: image ?? null,
      username: currentUser?.username || fallbackUsername,
    })

    const generalRoom = await roomService.ensureGeneralRoom()
    const membership = await roomService.ensureMembership(generalRoom.id, id)

    return {
      user: updatedUser,
      generalRoom,
      membership,
    }
  },
}
