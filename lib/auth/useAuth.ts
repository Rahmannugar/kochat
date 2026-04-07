"use client"

import { useEffect } from "react"
import type { SignInValues, SignUpValues } from "@/lib/auth/auth.schema"
import { authClient } from "@/lib/auth/auth-client"
import { useAuthStore } from "@/lib/auth/auth.store"
import type { AuthSession } from "@/lib/auth/auth.types"

export const useAuth = () => {
  const sessionQuery = authClient.useSession()
  const user = useAuthStore((state) => state.user)
  const session = useAuthStore((state) => state.session)
  const setSession = useAuthStore((state) => state.setSession)
  const clearSession = useAuthStore((state) => state.clearSession)

  useEffect(() => {
    if (sessionQuery.isPending) {
      return
    }

    if (sessionQuery.data) {
      setSession(sessionQuery.data as AuthSession)
      return
    }

    clearSession()
  }, [clearSession, sessionQuery.data, sessionQuery.isPending, setSession])

  return {
    session,
    user,
    isLoading: sessionQuery.isPending,
    isAuthenticated: Boolean(user && session),
    signInWithEmail: (values: SignInValues) => authClient.signIn.email(values),
    signUpWithEmail: ({ confirmPassword: _confirmPassword, ...values }: SignUpValues) =>
      authClient.signUp.email(values),
    signInWithGoogle: () =>
      authClient.signIn.social({
        provider: "google",
        callbackURL: "/dashboard",
      }),
    sendEmailOtp: (email: string, type: "sign-in" | "email-verification" | "forget-password" = "sign-in") =>
      authClient.emailOtp.sendVerificationOtp({
        email,
        type,
      }),
    signInWithEmailOtp: ({
      email,
      otp,
      name,
    }: {
      email: string
      otp: string
      name?: string
    }) =>
      authClient.signIn.emailOtp({
        email,
        otp,
        name,
      }),
    signOut: () => authClient.signOut(),
  }
}
