import {
  handleRouteError,
  success,
  requireSessionUser,
} from "@/lib/utils/http";
import { userService } from "@/lib/users/user.service";
import { completeOnboardingSchema } from "@/lib/users/user.schema";

export const POST = async (request: Request) => {
  try {
    const sessionUser = await requireSessionUser();
    const payload = completeOnboardingSchema.parse(await request.json());
    const user = await userService.completeOnboarding({
      userId: sessionUser.id,
      name: payload.name,
      username: payload.username,
    });

    return success(user);
  } catch (routeError) {
    return handleRouteError(routeError);
  }
};
