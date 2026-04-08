import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth/auth"
import { db } from "@/lib/db"

const requestForgotPasswordSchema = z.object({
  email: z.email("Enter a valid email address"),
})

const hasCredentialPassword = async (email: string) => {
  const currentUser = await db.query.user.findFirst({
    where: (user, { sql }) => sql`lower(${user.email}) = lower(${email})`,
    with: {
      accounts: true,
    },
  })

  return Boolean(
    currentUser?.accounts.some(
      (account) => account.providerId === "credential" && Boolean(account.password),
    ),
  )
}

export const POST = async (request: Request) => {
  try {
    const payload = requestForgotPasswordSchema.parse(await request.json())

    if (!(await hasCredentialPassword(payload.email))) {
      return NextResponse.json({ data: { success: true } })
    }

    const result = await auth.api.requestPasswordResetEmailOTP({
      body: {
        email: payload.email,
      },
    })

    return NextResponse.json({ data: result })
  } catch {
    return NextResponse.json({ data: { success: true } })
  }
}
