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
  confirmPassword: z
    .string()
    .min(1, "Confirm your password")
    .max(128, "Password is too long"),
}).superRefine((values, context) => {
  if (
    values.confirmPassword.length > 0 &&
    values.password !== values.confirmPassword
  ) {
    context.addIssue({
      code: "custom",
      message: "Passwords do not match",
      path: ["confirmPassword"],
    })
  }
})

export type SignInValues = z.infer<typeof signInSchema>
export type SignUpValues = z.infer<typeof signUpSchema>
