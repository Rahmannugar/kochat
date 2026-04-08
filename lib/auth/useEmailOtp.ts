"use client"

import { useCallback, useState } from "react"
import { authClient } from "@/lib/auth/auth-client"
import { apiClient } from "@/lib/utils/client"

type EmailOtpType = "sign-in" | "email-verification" | "forget-password"

const getResultErrorMessage = (result: unknown, fallbackMessage: string) => {
  if (
    result &&
    typeof result === "object" &&
    "error" in result &&
    result.error &&
    typeof result.error === "object" &&
    "message" in result.error &&
    typeof result.error.message === "string"
  ) {
    return result.error.message
  }

  return fallbackMessage
}

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
        const result = await authClient.emailOtp.sendVerificationOtp({
          email,
          type,
        })

        if (
          result &&
          typeof result === "object" &&
          "error" in result &&
          result.error
        ) {
          const message = getResultErrorMessage(result, "Failed to send OTP")
          setError(message)
          throw new Error(message)
        }

        return result
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
        const result = await authClient.signIn.emailOtp({
          email,
          otp,
          name,
        })

        if (
          result &&
          typeof result === "object" &&
          "error" in result &&
          result.error
        ) {
          const message = getResultErrorMessage(result, "Failed to verify OTP")
          setError(message)
          throw new Error(message)
        }

        return result
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

  const verifyEmail = useCallback(
    async ({
      email,
      otp,
    }: {
      email: string
      otp: string
    }) => {
      setIsPending(true)
      setError(null)

      try {
        const result = await authClient.emailOtp.verifyEmail({
          email,
          otp,
        })

        if (
          result &&
          typeof result === "object" &&
          "error" in result &&
          result.error
        ) {
          const message = getResultErrorMessage(result, "Failed to verify email")
          setError(message)
          throw new Error(message)
        }

        return result
      } catch (otpError) {
        const message =
          otpError instanceof Error ? otpError.message : "Failed to verify email"
        setError(message)
        throw otpError
      } finally {
        setIsPending(false)
      }
    },
    [],
  )

  const requestPasswordReset = useCallback(
    async (email: string) => {
      setIsPending(true)
      setError(null)

      try {
        const result = await apiClient.post<{ data: { success: boolean } }>(
          "/auth/forgot-password/request",
          { email },
        )

        return result.data
      } catch (resetError) {
        const message =
          resetError instanceof Error ? resetError.message : "Failed to send reset code"
        setError(message)
        throw resetError
      } finally {
        setIsPending(false)
      }
    },
    [],
  )

  const resetPassword = useCallback(
    async ({
      email,
      otp,
      password,
    }: {
      email: string
      otp: string
      password: string
    }) => {
      setIsPending(true)
      setError(null)

      try {
        const result = await authClient.emailOtp.resetPassword({
          email,
          otp,
          password,
        })

        if (
          result &&
          typeof result === "object" &&
          "error" in result &&
          result.error
        ) {
          const message = getResultErrorMessage(result, "Failed to reset password")
          setError(message)
          throw new Error(message)
        }

        return result
      } catch (resetError) {
        const message =
          resetError instanceof Error ? resetError.message : "Failed to reset password"
        setError(message)
        throw resetError
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
    verifyEmail,
    requestPasswordReset,
    resetPassword,
  }
}
