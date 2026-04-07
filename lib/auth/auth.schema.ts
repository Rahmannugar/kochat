import { z } from "zod"
import { nameSchema, usernameSchema } from "@/lib/users/user.schema"

export const signInSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password is too long"),
})

export const signUpSchema = signInSchema.extend({
  name: nameSchema,
  username: usernameSchema,
})

export type SignInValues = z.infer<typeof signInSchema>
export type SignUpValues = z.infer<typeof signUpSchema>
