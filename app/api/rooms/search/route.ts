import {
  handleRouteError,
  requireAppUser,
  success,
} from "@/lib/utils/http"
import { searchRoomsSchema } from "@/lib/rooms/room.schema"
import { roomService } from "@/lib/rooms/room.service"

export const GET = async (request: Request) => {
  try {
    const sessionUser = await requireAppUser()
    const { searchParams } = new URL(request.url)
    const params = searchRoomsSchema.parse({
      query: searchParams.get("query") ?? "",
      limit: searchParams.get("limit") ?? undefined,
      cursor: searchParams.get("cursor") ?? undefined,
    })

    const rooms = await roomService.searchRoomsPageForUser({
      userId: sessionUser.id,
      query: params.query,
      limit: params.limit,
      cursor: params.cursor,
    })

    return success(rooms)
  } catch (routeError) {
    return handleRouteError(routeError)
  }
}
