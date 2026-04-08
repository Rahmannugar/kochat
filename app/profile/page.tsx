import { ProfilePageShell } from "@/components/workspace/ProfilePageShell"
import { requireAuthUser } from "@/lib/auth/requireAuthUser"

const ProfilePage = async () => {
  const user = await requireAuthUser()

  return <ProfilePageShell user={user} />
}

export default ProfilePage
