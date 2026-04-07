import {
  handleRouteError,
  success,
  requireSessionUser,
} from "@/lib/utils/http";
import { roomService } from "@/lib/rooms/room.service";
import { joinGroupRoomSchema } from "@/lib/rooms/room.schema";

export const POST = async (request: Request) => {
  try {
    const sessionUser = await requireSessionUser();
    const payload = joinGroupRoomSchema.parse(await request.json());
    const room = await roomService.joinGroupRoomByCode(
      payload.code,
      sessionUser.id,
    );

    return success(room);
  } catch (routeError) {
    return handleRouteError(routeError);
  }
};
