import {
  handleRouteError,
  success,
  requireAppUser,
} from "@/lib/utils/http";
import { roomService } from "@/lib/rooms/room.service";
import { createGroupRoomSchema } from "@/lib/rooms/room.schema";

export const POST = async (request: Request) => {
  try {
    const sessionUser = await requireAppUser();
    const payload = createGroupRoomSchema.parse(await request.json());
    const room = await roomService.createGroupRoom({
      name: payload.name,
      description: payload.description,
      createdBy: sessionUser.id,
    });

    return success(room, { status: 201 });
  } catch (routeError) {
    return handleRouteError(routeError);
  }
};
