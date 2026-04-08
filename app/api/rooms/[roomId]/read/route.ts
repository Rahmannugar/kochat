import { markRoomReadSchema } from "@/lib/messages/message.schema"
import { messageService } from "@/lib/messages/message.service"
import { roomIdParamsSchema } from "@/lib/rooms/room.schema"
import { handleRouteError, requireAppUser, success } from "@/lib/utils/http"

type RouteContext = {
  params: Promise<{
    roomId: string
  }>
}

export const POST = async (request: Request, context: RouteContext) => {
  try {
    const sessionUser = await requireAppUser()
    const { roomId } = roomIdParamsSchema.parse(await context.params)
    const payload = markRoomReadSchema.parse(await request.json())
    const receipt = await messageService.markRoomRead({
      roomId,
      userId: sessionUser.id,
      messageId: payload.messageId,
    })

    return success(receipt)
  } catch (routeError) {
    return handleRouteError(routeError)
  }
}
