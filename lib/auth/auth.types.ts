export type AuthUser = {
  id: string
  name: string
  email: string
  emailVerified?: boolean
  username?: string | null
  bio?: string | null
  image?: string | null
}

export type AuthSession = {
  user: AuthUser
  session: {
    id: string
    userId: string
    expiresAt: string | Date
  }
}

export type AuthStoreState = {
  user: AuthUser | null
  session: AuthSession["session"] | null
  setSession: (session: AuthSession | null) => void
  clearSession: () => void
}

export type AuthRailContext = {
  user: AuthUser | null
  isEmailVerified: boolean
  isOnboarded: boolean
}
