import {
  handleRouteError,
  success,
  requireAppUser,
} from "@/lib/utils/http";
import { userService } from "@/lib/users/user.service";
import { updateUserProfileSchema } from "@/lib/users/user.schema";

export const PATCH = async (request: Request) => {
  try {
    const sessionUser = await requireAppUser();
    const payload = updateUserProfileSchema.parse(await request.json());
    const user = await userService.updateUserProfile({
      userId: sessionUser.id,
      name: payload.name,
      username: payload.username,
      bio: payload.bio,
      image: payload.image,
    });

    return success(user);
  } catch (routeError) {
    return handleRouteError(routeError);
  }
};
