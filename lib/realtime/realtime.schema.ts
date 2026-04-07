import { z } from "zod"

export const updateTypingSchema = z.object({
  isTyping: z.boolean(),
})

export const updatePresenceSchema = z.object({
  active: z.boolean().optional().default(true),
})
