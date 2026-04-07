import {
  handleRouteError,
  success,
  requireSessionUser,
} from "@/lib/utils/http";
import { roomService } from "@/lib/rooms/room.service";
import { roomIdParamsSchema } from "@/lib/rooms/room.schema";

type RouteContext = {
  params: Promise<{
    roomId: string;
  }>;
};

export const GET = async (_request: Request, context: RouteContext) => {
  try {
    const sessionUser = await requireSessionUser();
    const { roomId } = roomIdParamsSchema.parse(await context.params);
    const room = await roomService.getRoomForUser(roomId, sessionUser.id);

    return success(room);
  } catch (routeError) {
    return handleRouteError(routeError);
  }
};
