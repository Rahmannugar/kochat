import { redirect } from "next/navigation"
import { OnboardingForm } from "@/components/auth/onboarding"
import { getServerSession } from "@/lib/auth/auth"
import { authService } from "@/lib/auth/auth.service"

const OnboardingPage = async () => {
  const session = await getServerSession()

  if (!session) {
    redirect("/sign-in")
  }

  const authRoute = await authService.getAuthRoute(session.user.id)

  if (authRoute !== "/onboarding") {
    redirect(authRoute)
  }

  return (
    <OnboardingForm
      initialName={session.user.name ?? ""}
      initialEmail={session.user.email}
    />
  )
}

export default OnboardingPage
