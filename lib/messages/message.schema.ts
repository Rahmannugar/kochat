import { z } from "zod"

const messageTypeSchema = z.enum(["text", "image", "voice"])
const optionalLimitSchema = z.preprocess(
  (value) => (value === null || value === undefined || value === "" ? undefined : value),
  z.coerce.number().int().min(1).max(100).optional(),
)
const optionalCursorSchema = z.preprocess(
  (value) => (value === null || value === undefined || value === "" ? undefined : value),
  z.uuid("Cursor must be a valid message id").optional(),
)

export const roomMessagesQuerySchema = z.object({
  limit: optionalLimitSchema,
  cursor: optionalCursorSchema,
})

export const searchRoomMessagesQuerySchema = z.object({
  query: z.string().trim().min(1, "Enter a search query"),
  limit: optionalLimitSchema,
  cursor: optionalCursorSchema,
})

export const createMessageSchema = z.object({
  content: z.string().trim().min(1, "Message content is required").max(5000, "Message is too long"),
  messageType: messageTypeSchema.optional(),
  imageUrl: z.url("Image must be a valid URL").nullable().optional(),
  audioUrl: z.url("Audio must be a valid URL").nullable().optional(),
  audioTranscript: z.string().trim().max(5000, "Transcript is too long").nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
})

export const markRoomReadSchema = z.object({
  messageId: z.uuid("Message id must be a valid UUID"),
})
