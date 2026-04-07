import { requireSessionUser, handleRouteError, success, HttpError } from "@/lib/utils/http"
import { storageService } from "@/lib/storage/storage.service"
import { userService } from "@/lib/services/user.service"

export const POST = async (request: Request) => {
  try {
    const sessionUser = await requireSessionUser()
    const formData = await request.formData()
    const file = formData.get("file")

    if (!(file instanceof File)) {
      throw new HttpError(400, "Avatar file is required")
    }

    const upload = await storageService.uploadAvatar(sessionUser.id, file)
    const user = await userService.updateUserAvatar({
      userId: sessionUser.id,
      image: upload.publicUrl,
    })

    return success({ upload, user }, { status: 201 })
  } catch (routeError) {
    return handleRouteError(routeError)
  }
}
