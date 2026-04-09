import {
  handleRouteError,
  requireAppUser,
  success,
} from "@/lib/utils/http"
import { userService } from "@/lib/users/user.service"
import { userLookupSchema } from "@/lib/users/user.schema"

export const POST = async (request: Request) => {
  try {
    await requireAppUser()

    const body = await request.json()
    const { query } = userLookupSchema.parse(body)
    const user = await userService.findUserByUsernameOrEmail(query)

    return success(user)
  } catch (routeError) {
    return handleRouteError(routeError)
  }
}
