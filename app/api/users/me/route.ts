import {
  success,
  handleRouteError,
  requireSessionUser,
} from "@/lib/utils/http";
import { userService } from "@/lib/users/user.service";

export const GET = async () => {
  try {
    const sessionUser = await requireSessionUser();
    const user = await userService.getUserById(sessionUser.id);

    return success(user);
  } catch (routeError) {
    return handleRouteError(routeError);
  }
};
