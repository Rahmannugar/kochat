import { roomIdParamsSchema } from "@/lib/rooms/room.schema"
import { roomService } from "@/lib/rooms/room.service"
import { updatePresenceSchema } from "@/lib/realtime/realtime.schema"
import { realtimeState } from "@/lib/realtime/realtime-state"
import { handleRouteError, requireSessionUser, success } from "@/lib/utils/http"

type RouteContext = {
  params: Promise<{
    roomId: string
  }>
}

export const runtime = "nodejs"

export const POST = async (request: Request, context: RouteContext) => {
  try {
    const sessionUser = await requireSessionUser()
    const { roomId } = roomIdParamsSchema.parse(await context.params)
    const payload = updatePresenceSchema.parse(await request.json())

    await roomService.getRoomForUser(roomId, sessionUser.id)

    const activeUsers = await realtimeState.updatePresence({
      roomId,
      userId: sessionUser.id,
      userName: sessionUser.name ?? null,
      image: sessionUser.image ?? null,
      active: payload.active,
    })

    return success({
      activeUsers,
    })
  } catch (routeError) {
    return handleRouteError(routeError)
  }
}
