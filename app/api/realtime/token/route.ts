import { createHmac } from "node:crypto"
import { requireAppUser, success } from "@/lib/utils/http"
import { getServerEnv } from "@/lib/env/server"

const encodeBase64Url = (value: string) =>
  Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "")

const signJwt = (payload: Record<string, unknown>, secret: string) => {
  const header = {
    alg: "HS256",
    typ: "JWT",
  }

  const encodedHeader = encodeBase64Url(JSON.stringify(header))
  const encodedPayload = encodeBase64Url(JSON.stringify(payload))
  const unsignedToken = `${encodedHeader}.${encodedPayload}`
  const signature = createHmac("sha256", secret)
    .update(unsignedToken)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "")

  return `${unsignedToken}.${signature}`
}

export const runtime = "nodejs"

export const GET = async () => {
  const user = await requireAppUser()
  const env = getServerEnv()

  if (!env.SUPABASE_JWT_SECRET) {
    throw new Error("Supabase Realtime JWT secret is not configured")
  }

  const nowInSeconds = Math.floor(Date.now() / 1000)
  const expiresAt = nowInSeconds + 60 * 60
  const token = signJwt(
    {
      iss: `${env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1`,
      aud: "authenticated",
      exp: expiresAt,
      iat: nowInSeconds,
      sub: user.id,
      email: user.email,
      role: "authenticated",
    },
    env.SUPABASE_JWT_SECRET,
  )

  return success({
    token,
    expiresAt,
  })
}
