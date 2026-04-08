import { redirect } from "next/navigation"
import { getServerSession } from "@/lib/auth/auth"
import { AuthGuard } from "@/components/auth/auth-guard"
import { WorkspaceShell } from "@/components/workspace/WorkspaceShell"
import { authService } from "@/lib/auth/auth.service"

const DashboardPage = async () => {
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

  return (
    <AuthGuard initialUser={session.user}>
      <WorkspaceShell
        user={{
          id: bootstrap.user.id,
          name: bootstrap.user.name,
          email: bootstrap.user.email,
          username: bootstrap.user.username,
          bio: bootstrap.user.bio,
          image: bootstrap.user.image,
        }}
      />
    </AuthGuard>
  )
}

export default DashboardPage
