import { redirect } from "next/navigation"
import { SignUpForm } from "@/components/auth/sign-up"
import { getServerSession } from "@/lib/auth/auth"

const SignUpPage = async () => {
  const session = await getServerSession()

  if (session) {
    redirect("/dashboard")
  }

  return <SignUpForm />
}

export default SignUpPage
