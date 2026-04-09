import { createHash, createHmac } from "node:crypto"
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

const deriveDeterministicUuid = (value: string) => {
  const bytes = createHash("sha256").update(value).digest().subarray(0, 16)

  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80

  const hex = bytes.toString("hex")

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join("-")
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
  const realtimeSubjectId = deriveDeterministicUuid(`realtime-user:${user.id}`)
  const realtimeSessionId = deriveDeterministicUuid(
    `realtime-session:${user.id}:${nowInSeconds}`,
  )
  const token = signJwt(
    {
      iss: `${env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1`,
      aud: "authenticated",
      exp: expiresAt,
      iat: nowInSeconds,
      sub: realtimeSubjectId,
      email: user.email,
      role: "authenticated",
      aal: "aal1",
      session_id: realtimeSessionId,
      is_anonymous: false,
      app_user_id: user.id,
    },
    env.SUPABASE_JWT_SECRET,
  )

  return success({
    token,
    expiresAt,
  })
}
