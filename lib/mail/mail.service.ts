import nodemailer from "nodemailer"
import { getServerEnv } from "@/lib/env/server"

let cachedTransporter: nodemailer.Transporter | undefined

const createTransporter = () => {
  const env = getServerEnv()

  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  })
}

const getTransporter = () => {
  if (cachedTransporter) {
    return cachedTransporter
  }

  cachedTransporter = createTransporter()
  return cachedTransporter
}

export const mailService = {
  send: async ({
    to,
    subject,
    text,
    html,
  }: {
    to: string
    subject: string
    text: string
    html: string
  }) => {
    const env = getServerEnv()

    await getTransporter().sendMail({
      from: env.SMTP_FROM,
      to,
      subject,
      text,
      html,
    })
  },
}
