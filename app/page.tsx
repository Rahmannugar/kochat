import { redirect } from "next/navigation"
import { getServerSession } from "@/lib/auth/auth"
import { authService } from "@/lib/auth/auth.service"

const Home = async () => {
  const session = await getServerSession()

  if (session) {
    redirect(await authService.getAuthRoute(session.user.id))
  }

  redirect("/sign-in")
}

export default Home
