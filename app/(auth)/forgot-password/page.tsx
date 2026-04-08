import { redirect } from "next/navigation"
import { ForgotPasswordForm } from "@/components/auth/ForgotPassword"
import { getServerSession } from "@/lib/auth/auth"
import { authService } from "@/lib/auth/auth.service"

const ForgotPasswordPage = async () => {
  const session = await getServerSession()

  if (session) {
    redirect(await authService.getAuthRoute(session.user.id))
  }

  return <ForgotPasswordForm />
}

export default ForgotPasswordPage
