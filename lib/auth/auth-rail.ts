import { createRail, requireAuth } from "authrail"
import type { AuthRailContext } from "./auth.types"

export const authenticatedRail = createRail<AuthRailContext>("authenticated", [
  requireAuth("/sign-in"),
  (ctx) => {
    if (!ctx.isOnboarded) {
      return {
        decision: {
          type: "redirect",
          to: "/onboarding",
        } as const,
      }
    }
  },
])
