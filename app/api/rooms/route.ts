import {
  handleRouteError,
  success,
  requireAppUser,
} from "@/lib/utils/http";
import { roomService } from "@/lib/rooms/room.service";

export const GET = async () => {
  try {
    const sessionUser = await requireAppUser();
    const rooms = await roomService.listRoomsForUser(sessionUser.id);

    return success(rooms);
  } catch (routeError) {
    return handleRouteError(routeError);
  }
};
