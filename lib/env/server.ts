type RequiredServerEnvKey =
  | "DATABASE_URL"
  | "BETTER_AUTH_SECRET"
  | "BETTER_AUTH_URL"
  | "GOOGLE_CLIENT_ID"
  | "GOOGLE_CLIENT_SECRET"
  | "NEXT_PUBLIC_SUPABASE_URL"
  | "SUPABASE_SERVICE_ROLE_KEY"
  | "SMTP_HOST"
  | "SMTP_PORT"
  | "SMTP_USER"
  | "SMTP_PASS"
  | "SMTP_FROM";

type ServerEnv = {
  DATABASE_URL: string
  BETTER_AUTH_SECRET: string
  BETTER_AUTH_URL: string
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
  NEXT_PUBLIC_SUPABASE_URL: string
  SUPABASE_SERVICE_ROLE_KEY: string
  SMTP_HOST: string
  SMTP_PORT: number
  SMTP_USER: string
  SMTP_PASS: string
  SMTP_FROM: string
  SMTP_SECURE: boolean
  GITHUB_CLIENT_ID?: string
  GITHUB_CLIENT_SECRET?: string
  NEXT_PUBLIC_SUPABASE_ANON_KEY?: string
  AI_PROVIDER?: string
  AI_API_KEY?: string
  AI_MODEL?: string
  VAPID_SUBJECT?: string
  VAPID_PUBLIC_KEY?: string
  VAPID_PRIVATE_KEY?: string
}

let cachedEnv: ServerEnv | undefined;

const requiredKeys: RequiredServerEnvKey[] = [
  "DATABASE_URL",
  "BETTER_AUTH_SECRET",
  "BETTER_AUTH_URL",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASS",
  "SMTP_FROM",
]

export const getServerEnv = () => {
  if (cachedEnv) {
    return cachedEnv;
  }

  const missingKeys = requiredKeys.filter((key) => !process.env[key]);

  if (missingKeys.length > 0) {
    throw new Error(
      `Missing required server environment variables: ${missingKeys.join(", ")}`,
    );
  }

  cachedEnv = {
    DATABASE_URL: process.env.DATABASE_URL as string,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET as string,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL as string,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID as string,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET as string,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY as string,
    SMTP_HOST: process.env.SMTP_HOST as string,
    SMTP_PORT: Number(process.env.SMTP_PORT),
    SMTP_USER: process.env.SMTP_USER as string,
    SMTP_PASS: process.env.SMTP_PASS as string,
    SMTP_FROM: process.env.SMTP_FROM as string,
    SMTP_SECURE: process.env.SMTP_SECURE === "true",
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
    AI_PROVIDER: process.env.AI_PROVIDER,
    AI_API_KEY: process.env.AI_API_KEY,
    AI_MODEL: process.env.AI_MODEL,
    VAPID_SUBJECT: process.env.VAPID_SUBJECT,
    VAPID_PUBLIC_KEY: process.env.VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY,
  }

  return cachedEnv
}
