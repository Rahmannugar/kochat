import { AI_SYSTEM_PROMPT } from "@/lib/ai/ai.config";
import { consumeAiUsage } from "@/lib/ai/ai-usage.utils";
import { getAiClient } from "@/lib/ai/ai-client";
import type { AiImageInput, AiPromptMessage } from "@/lib/ai/ai.types";
import { messageRepository } from "@/lib/messages/message.repository";
import { roomEvents } from "@/lib/realtime/room-events";
import { roomRepository } from "@/lib/rooms/room.repository";
import { storageService } from "@/lib/storage/storage.service";

const AI_INVOCATION_PATTERN = /(^|\s)@ai\b/i;
const ROOM_CONTEXT_LIMIT = 20;

const assertActiveRoomMembership = async (roomId: string, userId: string) => {
  const membership = await roomRepository.findMembership(roomId, userId);

  if (!membership || membership.archivedAt) {
    throw new Error("You do not have access to this room");
  }

  return membership;
};

const stripAiInvocation = (content: string) =>
  content.replace(/@ai\b/gi, "").trim();

const getMessageImageAttachments = (message: {
  imageUrl: string | null
  metadata: Record<string, unknown> | null
  attachments: Array<{
    kind: "image" | "audio"
    url: string
    storagePath?: string | null
  }> | null
}) => {
  const attachments = message.attachments?.filter(
    (attachment) => attachment.kind === "image" && attachment.storagePath,
  ) ?? []

  if (attachments.length > 0) {
    return attachments.map((attachment) => ({
      imageUrl: attachment.url,
      storagePath: attachment.storagePath ?? null,
    }))
  }

  if (
    message.imageUrl &&
    message.metadata &&
    typeof message.metadata === "object" &&
    "storagePath" in message.metadata &&
    typeof message.metadata.storagePath === "string"
  ) {
    return [
      {
        imageUrl: message.imageUrl,
        storagePath: message.metadata.storagePath,
      },
    ]
  }

  return []
}

const getMessagePromptContent = (message: {
  messageType: "text" | "image" | "voice"
  content: string
  audioTranscript: string | null
  attachments: Array<{
    kind: "image" | "audio"
    transcript?: string | null
  }> | null
}) => {
  const audioAttachment = message.attachments?.find(
    (attachment) => attachment.kind === "audio" && attachment.transcript,
  )

  if (message.messageType === "image" && !message.content) {
    return "[shared image]"
  }

  if (message.messageType === "voice" && message.audioTranscript) {
    return message.audioTranscript
  }

  if (audioAttachment?.transcript) {
    return audioAttachment.transcript
  }

  return message.content
}

const formatHumanMessage = (
  name: string | null | undefined,
  content: string,
) => {
  const label = name?.trim() || "User";

  return `${label}: ${content}`;
};

const buildPromptPayload = async (
  roomId: string,
  triggerMessageId: string,
): Promise<{
  messages: AiPromptMessage[]
  images: AiImageInput[]
}> => {
  const contextMessages = await messageRepository.listRecentByRoomId(
    roomId,
    ROOM_CONTEXT_LIMIT,
  );
  const triggerMessage = contextMessages.find(
    (message) => message.id === triggerMessageId,
  );

  if (!triggerMessage) {
    throw new Error("Trigger message was not found in room context");
  }

  if (triggerMessage.sender !== "human") {
    throw new Error("Only human messages can invoke the AI assistant");
  }

  if (!AI_INVOCATION_PATTERN.test(triggerMessage.content)) {
    throw new Error("Trigger message does not invoke the AI assistant");
  }

  const conversationHistory = contextMessages
    .filter((message) => message.id !== triggerMessageId)
    .map<AiPromptMessage>((message) => {
      if (message.sender === "ai") {
        return {
          role: "assistant",
          content: message.content,
        };
      }

      return {
        role: "user",
        content: formatHumanMessage(
          message.senderUser?.name,
          getMessagePromptContent(message),
        ),
      };
    });

  const triggerPromptSource = getMessagePromptContent(triggerMessage)
  const cleanedTriggerContent = stripAiInvocation(triggerPromptSource);

  if (!cleanedTriggerContent) {
    throw new Error("AI invocation message must contain a prompt");
  }

  const recentTriggerImages = contextMessages
    .filter(
      (message) =>
        message.sender === "human" &&
        message.senderUserId === triggerMessage.senderUserId &&
        getMessageImageAttachments(message).length > 0,
    )
    .flatMap((message) => getMessageImageAttachments(message))
    .slice(-4);

  const images = await Promise.all(
    recentTriggerImages.map(async (attachment) => {
      if (!attachment.storagePath) {
        throw new Error("Image attachment storage path is missing")
      }

      return storageService.downloadChatImageAsBase64(attachment.storagePath);
    }),
  );

  return {
    messages: [
      {
        role: "system",
        content: AI_SYSTEM_PROMPT,
      },
      ...conversationHistory,
      {
        role: "user",
        content: formatHumanMessage(
          triggerMessage.senderUser?.name,
          cleanedTriggerContent,
        ),
      },
    ],
    images: images.map((image) => ({
      imageBase64: image.base64,
      mimeType: image.mimeType,
    })),
  };
};

type StreamAssistantReplyInput = {
  roomId: string;
  actorUserId: string;
  triggerMessageId: string;
};

export const aiService = {
  shouldInvokeAssistant: (content: string) =>
    AI_INVOCATION_PATTERN.test(content),

  streamAssistantReply: async ({
    roomId,
    actorUserId,
    triggerMessageId,
  }: StreamAssistantReplyInput) => {
    await assertActiveRoomMembership(roomId, actorUserId);
    await consumeAiUsage(actorUserId)

    const promptPayload = await buildPromptPayload(roomId, triggerMessageId);
    const aiClient = getAiClient();

    let resolveMessage:
      | ((value: Awaited<ReturnType<typeof messageRepository.create>>) => void)
      | undefined;
    let rejectMessage: ((reason?: unknown) => void) | undefined;

    const persistedMessage = new Promise<
      Awaited<ReturnType<typeof messageRepository.create>>
    >((resolve, reject) => {
      resolveMessage = resolve;
      rejectMessage = reject;
    });

    const stream = (async function* () {
      let fullText = "";

      try {
        for await (const chunk of aiClient.streamText({
          messages: promptPayload.messages,
          images: promptPayload.images,
        })) {
          if (!chunk.text) {
            continue;
          }

          fullText += chunk.text;
          yield chunk.text;
        }

        if (!fullText.trim()) {
          throw new Error("AI returned an empty response");
        }

        const createdMessage = await messageRepository.create({
          roomId,
          sender: "ai",
          content: fullText.trim(),
          metadata: {
            provider: aiClient.provider,
            triggerMessageId,
          },
        });

        const message = await messageRepository.findDetailedById(createdMessage.id)

        if (!message) {
          throw new Error("AI message could not be loaded after persistence")
        }

        await roomEvents.publish({
          roomId,
          type: "message.created",
          payload: {
            message,
          },
        })

        resolveMessage?.(message);
      } catch (streamError) {
        rejectMessage?.(streamError);
        throw streamError;
      }
    })();

    return {
      stream,
      persistedMessage,
    };
  },

  transcribeAudio: async ({
    actorUserId,
    roomId,
    audioBase64,
    mimeType,
    prompt,
  }: {
    actorUserId: string;
    roomId: string;
    audioBase64: string;
    mimeType: string;
    prompt?: string;
  }) => {
    await assertActiveRoomMembership(roomId, actorUserId);
    await consumeAiUsage(actorUserId)

    return getAiClient().transcribeAudio({
      audioBase64,
      mimeType,
      prompt,
    });
  },

  synthesizeSpeech: async ({
    actorUserId,
    roomId,
    text,
    voiceName,
  }: {
    actorUserId: string;
    roomId: string;
    text: string;
    voiceName?: string;
  }) => {
    await assertActiveRoomMembership(roomId, actorUserId);
    await consumeAiUsage(actorUserId)

    return getAiClient().synthesizeSpeech({
      text: text.trim(),
      voiceName,
    });
  },

  synthesizeAndStoreSpeech: async ({
    actorUserId,
    roomId,
    text,
    voiceName,
  }: {
    actorUserId: string;
    roomId: string;
    text: string;
    voiceName?: string;
  }) => {
    await assertActiveRoomMembership(roomId, actorUserId);
    await consumeAiUsage(actorUserId)

    const audio = await getAiClient().synthesizeSpeech({
      text: text.trim(),
      voiceName,
    });

    const storedAudio = await storageService.uploadGeneratedChatAudio({
      roomId,
      fileOwnerId: actorUserId,
      audioBase64: audio.audioBase64,
      mimeType: audio.mimeType,
    });

    return {
      ...audio,
      audioUrl: storedAudio.publicUrl,
      storagePath: storedAudio.path,
    };
  },
};
