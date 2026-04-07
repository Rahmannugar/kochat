"use client"

import { useCallback, useState } from "react"
import { authClient } from "@/lib/auth/auth-client"

type EmailOtpType = "sign-in" | "email-verification" | "forget-password"

export const useEmailOtp = () => {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sendOtp = useCallback(
    async ({
      email,
      type = "sign-in",
    }: {
      email: string
      type?: EmailOtpType
    }) => {
      setIsPending(true)
      setError(null)

      try {
        return await authClient.emailOtp.sendVerificationOtp({
          email,
          type,
        })
      } catch (otpError) {
        const message =
          otpError instanceof Error ? otpError.message : "Failed to send OTP"
        setError(message)
        throw otpError
      } finally {
        setIsPending(false)
      }
    },
    [],
  )

  const signInWithOtp = useCallback(
    async ({
      email,
      otp,
      name,
    }: {
      email: string
      otp: string
      name?: string
    }) => {
      setIsPending(true)
      setError(null)

      try {
        return await authClient.signIn.emailOtp({
          email,
          otp,
          name,
        })
      } catch (otpError) {
        const message =
          otpError instanceof Error ? otpError.message : "Failed to verify OTP"
        setError(message)
        throw otpError
      } finally {
        setIsPending(false)
      }
    },
    [],
  )

  return {
    isPending,
    error,
    sendOtp,
    signInWithOtp,
  }
}
