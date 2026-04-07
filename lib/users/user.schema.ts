import { z } from "zod"

export const nameSchema = z
  .string()
  .trim()
  .min(2, "Name must be at least 2 characters")
  .max(50, "Name must be 50 characters or fewer")

export const usernameSchema = z
  .string()
  .trim()
  .min(3, "Username must be at least 3 characters")
  .max(30, "Username must be 30 characters or fewer")
  .regex(/^[a-z0-9_]+$/, "Username can only contain lowercase letters, numbers, and underscores")

export const userLookupSchema = z.object({
  query: z.string().trim().min(1, "Enter a username or email"),
})

export const completeOnboardingSchema = z.object({
  name: nameSchema,
  username: usernameSchema,
})

export const updateUserProfileSchema = z.object({
  name: nameSchema,
  username: usernameSchema.optional(),
  bio: z
    .string()
    .trim()
    .max(160, "Bio must be 160 characters or fewer")
    .nullable()
    .optional(),
  image: z.url("Image must be a valid URL").nullable().optional(),
})
