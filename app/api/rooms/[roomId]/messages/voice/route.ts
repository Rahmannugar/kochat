import { aiService } from "@/lib/ai/ai.service";
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

export const runtime = "nodejs"

export const POST = async (request: Request, context: RouteContext) => {
  try {
    const sessionUser = await requireAppUser();
    const { roomId } = roomIdParamsSchema.parse(await context.params);
    await roomService.getRoomForUser(roomId, sessionUser.id);

    const formData = await request.formData();
    const file = formData.get("file");
    const promptValue = formData.get("prompt");
    const prompt = promptValue ? `${promptValue}`.trim() : undefined;

    if (!(file instanceof File)) {
      throw new HttpError(400, "Audio file is required");
    }

    const upload = await storageService.uploadChatAudio({
      roomId,
      userId: sessionUser.id,
      file,
    });

    const audioBase64 = Buffer.from(await file.arrayBuffer()).toString(
      "base64",
    );
    const transcript = await aiService.transcribeAudio({
      actorUserId: sessionUser.id,
      roomId,
      audioBase64,
      mimeType: file.type,
      prompt,
    });

    const transcriptText = transcript.text.trim();
    const message = await messageService.createHumanMessage({
      roomId,
      senderUserId: sessionUser.id,
      content: transcriptText || "Voice message",
      messageType: "voice",
      audioUrl: upload.publicUrl,
      audioTranscript: transcriptText || null,
      attachments: [
        {
          kind: "audio",
          url: upload.publicUrl,
          mimeType: upload.mimeType,
          transcript: transcriptText || null,
          storagePath: upload.path,
          size: upload.size,
        },
      ],
      metadata: {
        storagePath: upload.path,
        mimeType: upload.mimeType,
        size: upload.size,
        transcriptionProvider: transcript.provider,
        transcriptionModel: transcript.model,
      },
    });

    return success({ upload, transcript, message }, { status: 201 });
  } catch (routeError) {
    return handleRouteError(routeError);
  }
};
