import { z } from "zod"

export const roomIdParamsSchema = z.object({
  roomId: z.uuid("Room id must be a valid UUID"),
})

export const createGroupRoomSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Group name must be at least 2 characters")
    .max(80, "Group name must be 80 characters or fewer"),
  description: z
    .string()
    .trim()
    .max(300, "Description must be 300 characters or fewer")
    .optional(),
})

export const joinGroupRoomSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^GR-[A-Z0-9]+$/, "Enter a valid group code"),
})

export const createDirectRoomSchema = z.object({
  targetUserId: z.string().trim().min(1, "Target user id is required"),
})
