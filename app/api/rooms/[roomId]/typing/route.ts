import { roomIdParamsSchema } from "@/lib/rooms/room.schema"
import { roomService } from "@/lib/rooms/room.service"
import { updateTypingSchema } from "@/lib/realtime/realtime.schema"
import { realtimeState } from "@/lib/realtime/realtime-state"
import { handleRouteError, requireAppUser, success } from "@/lib/utils/http"

type RouteContext = {
  params: Promise<{
    roomId: string
  }>
}

export const runtime = "nodejs"

export const POST = async (request: Request, context: RouteContext) => {
  try {
    const sessionUser = await requireAppUser()
    const { roomId } = roomIdParamsSchema.parse(await context.params)
    const payload = updateTypingSchema.parse(await request.json())

    await roomService.getRoomForUser(roomId, sessionUser.id)

    const typingUsers = await realtimeState.updateTyping({
      roomId,
      userId: sessionUser.id,
      userName: sessionUser.name ?? null,
      isTyping: payload.isTyping,
    })

    return success({
      typingUsers,
    })
  } catch (routeError) {
    return handleRouteError(routeError)
  }
}
