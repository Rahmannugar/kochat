import { redirect } from "next/navigation"
import type { AuthUser } from "@/lib/auth/auth.types"
import { getServerSession } from "@/lib/auth/auth"
import { authService } from "@/lib/auth/auth.service"

export const requireAuthUser = async (): Promise<AuthUser> => {
  const session = await getServerSession()

  if (!session) {
    redirect("/sign-in")
  }

  const authRoute = await authService.getAuthRoute(session.user.id)

  if (authRoute !== "/dashboard") {
    redirect(authRoute)
  }

  const bootstrap = await authService.bootstrapUserAccount({
    id: session.user.id,
    name: session.user.name,
    image: session.user.image,
  })

  return {
    id: bootstrap.user.id,
    name: bootstrap.user.name,
    email: bootstrap.user.email,
    emailVerified: bootstrap.user.emailVerified,
    username: bootstrap.user.username,
    bio: bootstrap.user.bio,
    image: bootstrap.user.image,
  }
}
