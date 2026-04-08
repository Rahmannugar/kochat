import {
  handleRouteError,
  success,
  requireAppUser,
} from "@/lib/utils/http";
import { roomService } from "@/lib/rooms/room.service";
import { createDirectRoomSchema } from "@/lib/rooms/room.schema";

export const POST = async (request: Request) => {
  try {
    const sessionUser = await requireAppUser();
    const payload = createDirectRoomSchema.parse(await request.json());
    const room = await roomService.findOrCreateDirectRoom(
      sessionUser.id,
      payload.targetUserId,
    );

    return success(room, { status: 201 });
  } catch (routeError) {
    return handleRouteError(routeError);
  }
};
