import { aiService } from "@/lib/ai/ai.service";
import { synthesizeSpeechSchema } from "@/lib/ai/ai.schema";
import { roomIdParamsSchema } from "@/lib/rooms/room.schema";
import {
  handleRouteError,
  requireSessionUser,
  success,
} from "@/lib/utils/http";

type RouteContext = {
  params: Promise<{
    roomId: string;
  }>;
};

export const POST = async (request: Request, context: RouteContext) => {
  try {
    const sessionUser = await requireSessionUser();
    const { roomId } = roomIdParamsSchema.parse(await context.params);
    const payload = synthesizeSpeechSchema.parse(await request.json());
    const audio = await aiService.synthesizeAndStoreSpeech({
      actorUserId: sessionUser.id,
      roomId,
      text: payload.text,
      voiceName: payload.voiceName,
    });

    return success(audio);
  } catch (routeError) {
    return handleRouteError(routeError);
  }
};
