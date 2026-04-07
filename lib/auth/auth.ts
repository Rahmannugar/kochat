import { headers } from "next/headers"
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { db } from "@/lib/db"
import { getServerEnv } from "@/lib/env/server"
import * as schema from "@/lib/db/schema"

const env = getServerEnv()

export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      prompt: "select_account",
    },
  },
  experimental: {
    joins: true,
  },
})

export const getServerSession = async () => {
  return auth.api.getSession({
    headers: await headers(),
  })
}
