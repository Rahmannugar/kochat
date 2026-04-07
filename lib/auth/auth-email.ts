type SendOtpEmailInput = {
  appName: string
  email: string
  otp: string
  type: "sign-in" | "email-verification" | "forget-password" | "change-email"
}

const otpActionLabels: Record<SendOtpEmailInput["type"], string> = {
  "sign-in": "sign in to your account",
  "email-verification": "verify your email address",
  "forget-password": "reset your password",
  "change-email": "confirm your email change",
}

export const buildOtpEmail = ({
  appName,
  email,
  otp,
  type,
}: SendOtpEmailInput) => {
  const actionLabel = otpActionLabels[type]
  const subject = `${appName} verification code`
  const text = [
    `Use this code to ${actionLabel}: ${otp}`,
    "",
    "This code expires in 5 minutes.",
    "If you did not request this code, you can ignore this email.",
    "",
    `Email: ${email}`,
  ].join("\n")

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
      <p>Use this code to ${actionLabel}:</p>
      <p style="font-size: 32px; letter-spacing: 6px; font-weight: 700; margin: 24px 0;">${otp}</p>
      <p>This code expires in 5 minutes.</p>
      <p>If you did not request this code, you can ignore this email.</p>
      <p style="color: #6b7280; font-size: 14px;">Email: ${email}</p>
    </div>
  `

  return {
    subject,
    text,
    html,
  }
}
