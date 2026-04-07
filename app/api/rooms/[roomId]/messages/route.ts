import { aiService } from "@/lib/services/ai.service"
import { handleRouteError, success, requireSessionUser } from "@/lib/utils/http"
import { createMessageSchema, roomMessagesQuerySchema } from "@/lib/messages/message.schema"
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
    const { limit, cursor } = roomMessagesQuerySchema.parse({
      limit: searchParams.get("limit"),
      cursor: searchParams.get("cursor"),
    })
    const messages = await messageService.listRoomMessages({
      roomId,
      userId: sessionUser.id,
      limit,
      cursor,
    })

    return success(messages)
  } catch (routeError) {
    return handleRouteError(routeError)
  }
}

export const POST = async (request: Request, context: RouteContext) => {
  try {
    const sessionUser = await requireSessionUser()
    const { roomId } = roomIdParamsSchema.parse(await context.params)
    const payload = createMessageSchema.parse(await request.json())
    const message = await messageService.createHumanMessage({
      roomId,
      senderUserId: sessionUser.id,
      content: payload.content,
      messageType: payload.messageType,
      imageUrl: payload.imageUrl,
      audioUrl: payload.audioUrl,
      audioTranscript: payload.audioTranscript,
      metadata: payload.metadata,
    })

    return success(
      {
        message,
        invokesAi: aiService.shouldInvokeAssistant(message.content),
      },
      { status: 201 },
    )
  } catch (routeError) {
    return handleRouteError(routeError)
  }
}
