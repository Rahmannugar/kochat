import {
  handleRouteError,
  success,
  requireAppUser,
} from "@/lib/utils/http";
import { roomService } from "@/lib/rooms/room.service";

export const GET = async (request: Request) => {
  try {
    const sessionUser = await requireAppUser();
    const { searchParams } = new URL(request.url)
    const limitParam = searchParams.get("limit")
    const cursor = searchParams.get("cursor") ?? undefined
    const parsedLimit = limitParam ? Number(limitParam) : 10
    const limit = Number.isFinite(parsedLimit)
      ? Math.min(Math.max(parsedLimit, 1), 20)
      : 10
    const rooms = await roomService.listRoomsPageForUser({
      userId: sessionUser.id,
      limit,
      cursor,
    });

    return success(rooms);
  } catch (routeError) {
    return handleRouteError(routeError);
  }
};
