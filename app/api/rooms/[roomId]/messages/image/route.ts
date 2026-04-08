import { messageService } from "@/lib/messages/message.service";
import { roomService } from "@/lib/rooms/room.service";
import { storageService } from "@/lib/storage/storage.service";
import {
  HttpError,
  handleRouteError,
  requireAppUser,
  success,
} from "@/lib/utils/http";
import { roomIdParamsSchema } from "@/lib/rooms/room.schema";

type RouteContext = {
  params: Promise<{
    roomId: string;
  }>;
};

export const POST = async (request: Request, context: RouteContext) => {
  try {
    const sessionUser = await requireAppUser();
    const { roomId } = roomIdParamsSchema.parse(await context.params);
    await roomService.getRoomForUser(roomId, sessionUser.id);

    const formData = await request.formData();
    const file = formData.get("file");
    const content = `${formData.get("content") ?? ""}`.trim();

    if (!(file instanceof File)) {
      throw new HttpError(400, "Image file is required");
    }

    const upload = await storageService.uploadChatImage({
      roomId,
      userId: sessionUser.id,
      file,
    });

    const message = await messageService.createHumanMessage({
      roomId,
      senderUserId: sessionUser.id,
      content: content || "Image",
      messageType: "image",
      imageUrl: upload.publicUrl,
      metadata: {
        storagePath: upload.path,
        mimeType: upload.mimeType,
        size: upload.size,
      },
    });

    return success({ upload, message }, { status: 201 });
  } catch (routeError) {
    return handleRouteError(routeError);
  }
};
