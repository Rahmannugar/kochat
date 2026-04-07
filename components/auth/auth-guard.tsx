"use client"

import { useRouter } from "next/navigation"
import { RailBoundary } from "authrail"
import { authenticatedRail } from "@/lib/auth/auth-rail"
import { useAuth } from "@/hooks/useAuth"
import type { AuthUser } from "@/lib/auth/auth.types"

type AuthGuardProps = {
  children: React.ReactNode
  fallback?: React.ReactNode
  initialUser?: AuthUser | null
}

export const AuthGuard = ({ children, fallback = null, initialUser = null }: AuthGuardProps) => {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const effectiveUser = user ?? initialUser
  const isReady = initialUser ? true : !isLoading

  if (!isReady) {
    return fallback
  }

  return (
    <RailBoundary
      rail={authenticatedRail}
      context={{ user: effectiveUser }}
      onRedirect={(to) => router.replace(to)}
      fallback={fallback}
      denied={fallback}
    >
      {children}
    </RailBoundary>
  )
}
