import { aiService } from "@/lib/ai/ai.service"
import { messageService } from "@/lib/messages/message.service"
import { roomIdParamsSchema } from "@/lib/rooms/room.schema"
import { roomService } from "@/lib/rooms/room.service"
import { storageService } from "@/lib/storage/storage.service"
import {
  CHAT_AUDIO_ALLOWED_MIME_TYPES,
  CHAT_AUDIO_MAX_SIZE_BYTES,
  CHAT_IMAGE_ALLOWED_MIME_TYPES,
  CHAT_IMAGE_MAX_SIZE_BYTES,
} from "@/lib/storage/storage.constants"
import {
  HttpError,
  handleRouteError,
  requireAppUser,
  success,
} from "@/lib/utils/http"

type RouteContext = {
  params: Promise<{
    roomId: string
  }>
}

type MessageAttachment =
  | {
      kind: "image"
      url: string
      mimeType: string
      storagePath?: string | null
      size?: number | null
    }
  | {
      kind: "audio"
      url: string
      mimeType: string
      transcript?: string | null
      storagePath?: string | null
      size?: number | null
      label?: string | null
    }

const normalizeMimeType = (mimeType: string) =>
  mimeType.split(";")[0]?.trim().toLowerCase() || mimeType

export const runtime = "nodejs"

export const POST = async (request: Request, context: RouteContext) => {
  try {
    const sessionUser = await requireAppUser()
    const { roomId } = roomIdParamsSchema.parse(await context.params)
    await roomService.getRoomForUser(roomId, sessionUser.id)

    const formData = await request.formData()
    const content = `${formData.get("content") ?? ""}`.trim()
    const imageFiles = formData
      .getAll("images")
      .filter((value): value is File => value instanceof File)
    const audioFile = formData.get("audio")
    const audioLabel = `${formData.get("audioLabel") ?? ""}`.trim() || null

    if (
      !content &&
      imageFiles.length === 0 &&
      !(audioFile instanceof File)
    ) {
      throw new HttpError(400, "Add text, images, or audio before sending")
    }

    if (content.length > 5000) {
      throw new HttpError(400, "Message is too long")
    }

    if (imageFiles.length > 4) {
      throw new HttpError(400, "You can attach up to 4 images at a time")
    }

    for (const file of imageFiles) {
      if (!CHAT_IMAGE_ALLOWED_MIME_TYPES.includes(normalizeMimeType(file.type))) {
        throw new HttpError(400, "Select JPG, PNG, WebP, or GIF images only")
      }

      if (file.size > CHAT_IMAGE_MAX_SIZE_BYTES) {
        throw new HttpError(400, "Images must be 10MB or smaller")
      }
    }

    if (audioFile !== null && !(audioFile instanceof File)) {
      throw new HttpError(400, "Audio file is invalid")
    }

    if (audioFile instanceof File) {
      if (!CHAT_AUDIO_ALLOWED_MIME_TYPES.includes(normalizeMimeType(audioFile.type))) {
        throw new HttpError(400, "Select an MP3, WAV, WebM, OGG, or M4A audio file")
      }

      if (audioFile.size > CHAT_AUDIO_MAX_SIZE_BYTES) {
        throw new HttpError(400, "Audio files must be 5MB or smaller")
      }
    }

    const attachments: MessageAttachment[] = []

    for (const file of imageFiles) {
      const upload = await storageService.uploadChatImage({
        roomId,
        userId: sessionUser.id,
        file,
      })

      attachments.push({
        kind: "image",
        url: upload.publicUrl,
        mimeType: upload.mimeType,
        storagePath: upload.path,
        size: upload.size,
      })
    }

    let transcriptText: string | null = null

    if (audioFile instanceof File) {
      const upload = await storageService.uploadChatAudio({
        roomId,
        userId: sessionUser.id,
        file: audioFile,
      })

      const audioBase64 = Buffer.from(await audioFile.arrayBuffer()).toString("base64")
      const transcript = await aiService.transcribeAudio({
        actorUserId: sessionUser.id,
        roomId,
        audioBase64,
        mimeType: audioFile.type,
        prompt: content || undefined,
      })

      transcriptText = transcript.text.trim() || null

      attachments.push({
        kind: "audio",
        url: upload.publicUrl,
        mimeType: upload.mimeType,
        transcript: transcriptText,
        storagePath: upload.path,
        size: upload.size,
        label: audioLabel,
      })
    }

    const primaryImageAttachment = attachments.find(
      (attachment): attachment is Extract<MessageAttachment, { kind: "image" }> =>
        attachment.kind === "image",
    )
    const primaryAudioAttachment = attachments.find(
      (attachment): attachment is Extract<MessageAttachment, { kind: "audio" }> =>
        attachment.kind === "audio",
    )

    const message = await messageService.createHumanMessage({
      roomId,
      senderUserId: sessionUser.id,
      content: content || transcriptText || (attachments.length > 0 ? "" : content),
      messageType:
        primaryAudioAttachment && attachments.length === 1 && !content
          ? "voice"
          : primaryImageAttachment && attachments.length > 0 && !content && !primaryAudioAttachment
            ? "image"
            : "text",
      imageUrl: primaryImageAttachment?.url ?? null,
      audioUrl: primaryAudioAttachment?.url ?? null,
      audioTranscript: transcriptText,
      attachments,
      metadata: {
        composed: true,
      },
    })

    return success(
      {
        message,
        invokesAi: aiService.shouldInvokeAssistant(message.content),
      },
      { status: 201 },
    )
  } catch (routeError) {
    return handleRouteError(routeError)
  }
}
