import { redirect } from "next/navigation"
import { OnboardingForm } from "@/components/auth/onboarding"
import { getServerSession } from "@/lib/auth/auth"
import { authService } from "@/lib/auth/auth.service"

const OnboardingPage = async () => {
  const session = await getServerSession()

  if (!session) {
    redirect("/sign-in")
  }

  if ((await authService.getAuthRoute(session.user.id)) !== "/onboarding") {
    redirect("/dashboard")
  }

  return (
    <OnboardingForm
      initialName={session.user.name ?? ""}
      initialEmail={session.user.email}
    />
  )
}

export default OnboardingPage
