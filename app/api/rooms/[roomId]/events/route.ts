import { roomIdParamsSchema } from "@/lib/rooms/room.schema"
import { realtimeState } from "@/lib/realtime/realtime-state"
import { roomService } from "@/lib/rooms/room.service"
import { roomEvents } from "@/lib/realtime/room-events"
import { error, requireAppUser } from "@/lib/utils/http"

type RouteContext = {
  params: Promise<{
    roomId: string
  }>
}

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export const GET = async (request: Request, context: RouteContext) => {
  try {
    const sessionUser = await requireAppUser()
    const { roomId } = roomIdParamsSchema.parse(await context.params)
    await roomService.getRoomForUser(roomId, sessionUser.id)

    const encoder = new TextEncoder()

    const responseStream = new ReadableStream<Uint8Array>({
      async start(controller) {
        controller.enqueue(
          encoder.encode(
            `event: ready\ndata: ${JSON.stringify({ roomId })}\n\n`,
          ),
        )

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              roomId,
              type: "presence.updated",
              payload: {
                activeUsers: realtimeState.getRoomSnapshot(roomId).activeUsers,
              },
              occurredAt: new Date().toISOString(),
            })}\n\n`,
          ),
        )

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              roomId,
              type: "typing.updated",
              payload: {
                typingUsers: realtimeState.getRoomSnapshot(roomId).typingUsers,
              },
              occurredAt: new Date().toISOString(),
            })}\n\n`,
          ),
        )

        const unsubscribe = await roomEvents.subscribe(roomId, (event) => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(event)}\n\n`),
          )
        })

        const heartbeatId = setInterval(() => {
          controller.enqueue(encoder.encode(`event: heartbeat\ndata: {}\n\n`))
        }, 25_000)

        const closeStream = () => {
          clearInterval(heartbeatId)
          unsubscribe()
          try {
            controller.close()
          } catch {}
        }

        request.signal.addEventListener("abort", closeStream, { once: true })
      },
      cancel() {
        // Route handlers rely on request abort for cleanup; no-op here.
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
    const message =
      routeError instanceof Error ? routeError.message : "Failed to subscribe to room events"
    const status =
      typeof routeError === "object" && routeError && "status" in routeError
        ? Number((routeError as { status: unknown }).status) || 400
        : 400

    return error(status, message)
  }
}
