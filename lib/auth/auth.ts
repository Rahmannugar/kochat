import { headers } from "next/headers"
import { createHash } from "node:crypto"
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { emailOTP } from "better-auth/plugins"
import { db } from "@/lib/db"
import { getServerEnv } from "@/lib/env/server"
import * as schema from "@/lib/db/schema"
import { buildOtpEmail, buildWelcomeEmail } from "@/lib/auth/auth-email"
import { mailService } from "@/lib/mail/mail.service"

const env = getServerEnv()

export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google"],
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
