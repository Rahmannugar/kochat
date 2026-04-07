import { roomIdParamsSchema } from "@/lib/rooms/room.schema"
import { roomService } from "@/lib/services/room.service"
import { storageService } from "@/lib/storage/storage.service"
import { handleRouteError, HttpError, requireSessionUser, success } from "@/lib/utils/http"

type RouteContext = {
  params: Promise<{
    roomId: string
  }>
}

export const POST = async (request: Request, context: RouteContext) => {
  try {
    const sessionUser = await requireSessionUser()
    const { roomId } = roomIdParamsSchema.parse(await context.params)
    await roomService.getRoomForUser(roomId, sessionUser.id)

    const formData = await request.formData()
    const file = formData.get("file")

    if (!(file instanceof File)) {
      throw new HttpError(400, "Audio file is required")
    }

    const upload = await storageService.uploadChatAudio({
      roomId,
      userId: sessionUser.id,
      file,
    })

    return success(upload, { status: 201 })
  } catch (routeError) {
    return handleRouteError(routeError)
  }
}
