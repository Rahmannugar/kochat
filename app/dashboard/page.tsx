import { DashboardHub } from "@/components/workspace/DashboardHub"
import { requireAuthUser } from "@/lib/auth/requireAuthUser"

const DashboardPage = async () => {
  const user = await requireAuthUser()

  return <DashboardHub user={user} />
}

export default DashboardPage
