import { handleRouteError, success, requireSessionUser } from "@/lib/utils/http"
import { searchRoomMessagesQuerySchema } from "@/lib/messages/message.schema"
import { roomIdParamsSchema } from "@/lib/rooms/room.schema"
import { messageService } from "@/lib/services/message.service"

type RouteContext = {
  params: Promise<{
    roomId: string
  }>
}

export const GET = async (request: Request, context: RouteContext) => {
  try {
    const sessionUser = await requireSessionUser()
    const { roomId } = roomIdParamsSchema.parse(await context.params)
    const { searchParams } = new URL(request.url)
    const { query, limit } = searchRoomMessagesQuerySchema.parse({
      query: searchParams.get("query"),
      limit: searchParams.get("limit"),
    })
    const messages = await messageService.searchRoomMessages(roomId, sessionUser.id, query, limit)

    return success(messages)
  } catch (routeError) {
    return handleRouteError(routeError)
  }
}
