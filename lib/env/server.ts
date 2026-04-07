type RequiredServerEnvKey =
  | "DATABASE_URL"
  | "BETTER_AUTH_SECRET"
  | "BETTER_AUTH_URL"
  | "GOOGLE_CLIENT_ID"
  | "GOOGLE_CLIENT_SECRET"

type OptionalServerEnvKey = "NEXT_PUBLIC_SUPABASE_URL" | "NEXT_PUBLIC_SUPABASE_ANON_KEY"

type ServerEnv = Record<RequiredServerEnvKey, string> &
  Partial<Record<OptionalServerEnvKey, string>>

let cachedEnv: ServerEnv | undefined

const requiredKeys: RequiredServerEnvKey[] = [
  "DATABASE_URL",
  "BETTER_AUTH_SECRET",
  "BETTER_AUTH_URL",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
]

export const getServerEnv = () => {
  if (cachedEnv) {
    return cachedEnv
  }

  const missingKeys = requiredKeys.filter((key) => !process.env[key])

  if (missingKeys.length > 0) {
    throw new Error(`Missing required server environment variables: ${missingKeys.join(", ")}`)
  }

  cachedEnv = {
    DATABASE_URL: process.env.DATABASE_URL as string,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET as string,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL as string,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID as string,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET as string,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  }

  return cachedEnv
}
