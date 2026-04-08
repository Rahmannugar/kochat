import { headers } from "next/headers"
import { createHash } from "node:crypto"
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { emailOTP } from "better-auth/plugins"
import { db } from "@/lib/db"
import { getServerEnv } from "@/lib/env/server"
import * as schema from "@/lib/db/schema"
import { buildOtpEmail, buildWelcomeEmail } from "@/lib/auth/auth-email-templates"
import { mailService } from "@/lib/mail/mail.service"

const env = getServerEnv()

export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  user: {
    additionalFields: {
      username: {
        type: "string",
        required: false,
        returned: true,
        transform: {
          input: (value) =>
            typeof value === "string" ? value.trim().toLowerCase() : value,
        },
      },
      bio: {
        type: "string",
        required: false,
        returned: true,
      },
    },
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google", "github"],
    },
  },
  emailVerification: {
    async afterEmailVerification(user) {
      const message = buildWelcomeEmail({
        appName: "Kochat",
        appUrl: env.BETTER_AUTH_URL,
        email: user.email,
        userName: user.name,
      })

      await mailService.send({
        to: user.email,
        subject: message.subject,
        text: message.text,
        html: message.html,
      })
    },
  },
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  plugins: [
    emailOTP({
      expiresIn: 300,
      allowedAttempts: 3,
      rateLimit: {
        window: 60 * 60,
        max: 3,
      },
      storeOTP: {
        hash: async (otp) => {
          return createHash("sha256").update(otp).digest("hex")
        },
      },
      async sendVerificationOTP({ email, otp, type }) {
        const message = buildOtpEmail({
          appName: "Kochat",
          appUrl: env.BETTER_AUTH_URL,
          email,
          otp,
          type,
        })

        await mailService.send({
          to: email,
          subject: message.subject,
          text: message.text,
          html: message.html,
        })
      },
    }),
  ],
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      prompt: "select_account",
    },
    ...(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET
      ? {
          github: {
            clientId: env.GITHUB_CLIENT_ID,
            clientSecret: env.GITHUB_CLIENT_SECRET,
            scope: ["read:user", "user:email"],
          },
        }
      : {}),
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
