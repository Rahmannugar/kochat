import { redirect } from "next/navigation"
import { SignInForm } from "@/components/auth/sign-in"
import { getServerSession } from "@/lib/auth/auth"

const SignInPage = async () => {
  const session = await getServerSession()

  if (session) {
    redirect("/dashboard")
  }

  return <SignInForm />
}

export default SignInPage
