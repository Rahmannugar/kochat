import { redirect } from "next/navigation"
import { VerifyEmailForm } from "@/components/auth/verify-email"
import { getServerSession } from "@/lib/auth/auth"
import { authService } from "@/lib/auth/auth.service"

const VerifyEmailPage = async () => {
  const session = await getServerSession()

  if (!session) {
    redirect("/sign-in")
  }

  if ((await authService.getAuthRoute(session.user.id)) !== "/verify-email") {
    redirect(await authService.getAuthRoute(session.user.id))
  }

  return (
    <VerifyEmailForm
      email={session.user.email}
      initialName={session.user.name ?? ""}
    />
  )
}

export default VerifyEmailPage
