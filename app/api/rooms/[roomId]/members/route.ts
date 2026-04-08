import { roomService } from "@/lib/rooms/room.service"
import { roomIdParamsSchema } from "@/lib/rooms/room.schema"
import { handleRouteError, requireAppUser, success } from "@/lib/utils/http"

type RouteContext = {
  params: Promise<{
    roomId: string
  }>
}

export const GET = async (request: Request, context: RouteContext) => {
  try {
    const sessionUser = await requireAppUser()
    const { roomId } = roomIdParamsSchema.parse(await context.params)
    const { searchParams } = new URL(request.url)
    const limitParam = searchParams.get("limit")
    const cursor = searchParams.get("cursor") ?? undefined
    const parsedLimit = limitParam ? Number(limitParam) : 10
    const limit = Number.isFinite(parsedLimit)
      ? Math.min(Math.max(parsedLimit, 1), 20)
      : 10

    const members = await roomService.listMembersPageForUser({
      roomId,
      userId: sessionUser.id,
      limit,
      cursor,
    })

    return success(members)
  } catch (routeError) {
    return handleRouteError(routeError)
  }
}
