import { z } from "zod"

export const signInSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password is too long"),
})

export const signUpSchema = signInSchema.extend({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be 50 characters or fewer"),
})

export type SignInValues = z.infer<typeof signInSchema>
export type SignUpValues = z.infer<typeof signUpSchema>
