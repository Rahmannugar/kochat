import {
  success,
  handleRouteError,
  requireAppUser,
} from "@/lib/utils/http";
import { userService } from "@/lib/users/user.service";

export const GET = async () => {
  try {
    const sessionUser = await requireAppUser();
    const user = await userService.getUserById(sessionUser.id);

    return success(user);
  } catch (routeError) {
    return handleRouteError(routeError);
  }
};
