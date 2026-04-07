import { transcribeAudioSchema } from "@/lib/ai/ai.schema"
import { aiService } from "@/lib/services/ai.service"
import { roomIdParamsSchema } from "@/lib/rooms/room.schema"
import { handleRouteError, requireSessionUser, success } from "@/lib/utils/http"

type RouteContext = {
  params: Promise<{
    roomId: string
  }>
}

export const POST = async (request: Request, context: RouteContext) => {
  try {
    const sessionUser = await requireSessionUser()
    const { roomId } = roomIdParamsSchema.parse(await context.params)
    const payload = transcribeAudioSchema.parse(await request.json())
    const transcript = await aiService.transcribeAudio({
      actorUserId: sessionUser.id,
      roomId,
      audioBase64: payload.audioBase64,
      mimeType: payload.mimeType,
      prompt: payload.prompt,
    })

    return success(transcript)
  } catch (routeError) {
    return handleRouteError(routeError)
  }
}
