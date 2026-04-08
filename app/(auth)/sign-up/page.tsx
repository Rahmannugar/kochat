import { redirect } from "next/navigation"
import { SignUpForm } from "@/components/auth/SignUp"
import { getServerSession } from "@/lib/auth/auth"
import { authService } from "@/lib/auth/auth.service"

const SignUpPage = async () => {
  const session = await getServerSession()

  if (session) {
    redirect(await authService.getAuthRoute(session.user.id))
  }

  return <SignUpForm />
}

export default SignUpPage
