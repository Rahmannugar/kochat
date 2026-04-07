import { handleRouteError, success, requireSessionUser } from "@/lib/utils/http"
import { roomService } from "@/lib/services/room.service"

export const GET = async () => {
  try {
    const sessionUser = await requireSessionUser()
    const rooms = await roomService.listRoomsForUser(sessionUser.id)

    return success(rooms)
  } catch (routeError) {
    return handleRouteError(routeError)
  }
}
