import { notFound, redirect } from "next/navigation"
import { UserProfilePageShell } from "@/components/workspace/UserProfilePageShell"
import { requireAuthUser } from "@/lib/auth/requireAuthUser"
import { userService } from "@/lib/users/user.service"

type UserProfilePageProps = {
  params: Promise<{
    userId: string
  }>
}

const UserProfilePage = async ({ params }: UserProfilePageProps) => {
  const authUser = await requireAuthUser()
  const { userId } = await params

  if (userId === authUser.id) {
    redirect("/profile")
  }

  let viewedUser

  try {
    viewedUser = await userService.getUserById(userId)
  } catch {
    notFound()
  }

  return <UserProfilePageShell authUser={authUser} viewedUser={viewedUser} />
}

export default UserProfilePage
