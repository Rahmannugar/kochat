import { aiService } from "@/lib/services/ai.service"
import { invokeAiSchema } from "@/lib/ai/ai.schema"
import { roomIdParamsSchema } from "@/lib/rooms/room.schema"
import { error, requireSessionUser } from "@/lib/utils/http"

type RouteContext = {
  params: Promise<{
    roomId: string
  }>
}

export const POST = async (request: Request, context: RouteContext) => {
  try {
    const sessionUser = await requireSessionUser()
    const { roomId } = roomIdParamsSchema.parse(await context.params)
    const payload = invokeAiSchema.parse(await request.json())
    const { stream, persistedMessage } = await aiService.streamAssistantReply({
      roomId,
      actorUserId: sessionUser.id,
      triggerMessageId: payload.triggerMessageId,
    })
    const encoder = new TextEncoder()

    const responseStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: "chunk", text: chunk })}\n\n`),
            )
          }

          const savedMessage = await persistedMessage

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "done", messageId: savedMessage.id })}\n\n`,
            ),
          )
          controller.close()
        } catch (streamError) {
          const message =
            streamError instanceof Error ? streamError.message : "AI streaming failed"

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "error", message })}\n\n`),
          )
          controller.close()
        }
      },
    })

    return new Response(responseStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    })
  } catch (routeError) {
    const message = routeError instanceof Error ? routeError.message : "AI request failed"
    const status =
      typeof routeError === "object" && routeError && "status" in routeError
        ? Number((routeError as { status: unknown }).status) || 400
        : 400

    return error(status, message)
  }
}
