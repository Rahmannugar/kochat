import { redirect } from "next/navigation"
import { VerifyEmailForm } from "@/components/auth/verify-email"
import { getServerSession } from "@/lib/auth/auth"
import { authService } from "@/lib/auth/auth.service"

const VerifyEmailPage = async ({
  searchParams,
}: {
  searchParams: Promise<{
    email?: string
  }>
}) => {
  const session = await getServerSession()
  const resolvedSearchParams = await searchParams
  const pendingEmail = resolvedSearchParams.email?.trim() || null

  if (!session && !pendingEmail) {
    redirect("/sign-in")
  }

  if (!pendingEmail && session) {
    const authRoute = await authService.getAuthRoute(session.user.id)

    if (authRoute !== "/verify-email") {
      redirect(authRoute)
    }
  }

  const email = pendingEmail ?? session?.user.email ?? null

  if (!email) {
    redirect("/sign-in")
  }

  return (
    <VerifyEmailForm
      email={email}
      sessionEmail={session?.user.email ?? null}
    />
  )
}

export default VerifyEmailPage
