import { redirect } from "next/navigation"
import { SignInForm } from "@/components/auth/sign-in"
import { getServerSession } from "@/lib/auth/auth"
import { authService } from "@/lib/auth/auth.service"

const SignInPage = async () => {
  const session = await getServerSession()

  if (session) {
    redirect(await authService.getAuthRoute(session.user.id))
  }

  return <SignInForm />
}

export default SignInPage
