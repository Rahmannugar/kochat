import { create } from "zustand"
import type { AuthSession, AuthStoreState } from "./auth.types"

const getNextState = (session: AuthSession | null) => ({
  user: session?.user ?? null,
  session: session?.session ?? null,
})

export const useAuthStore = create<AuthStoreState>((set) => ({
  user: null,
  session: null,
  setSession: (session) => set(getNextState(session)),
  clearSession: () => set(getNextState(null)),
}))
