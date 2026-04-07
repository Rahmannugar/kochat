import { z } from "zod";

export const invokeAiSchema = z.object({
  triggerMessageId: z.uuid("Trigger message id must be a valid UUID"),
});

export const transcribeAudioSchema = z.object({
  audioBase64: z.string().trim().min(1, "Audio payload is required"),
  mimeType: z.string().trim().min(1, "Audio mime type is required"),
  prompt: z.string().trim().max(500, "Prompt is too long").optional(),
});

export const synthesizeSpeechSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, "Text is required")
    .max(5000, "Text is too long"),
  voiceName: z.string().trim().min(1, "Voice name is required").optional(),
});
