import {
  handleRouteError,
  success,
  requireSessionUser,
} from "@/lib/utils/http";
import { userService } from "@/lib/users/user.service";
import { userLookupSchema } from "@/lib/users/user.schema";

export const GET = async (request: Request) => {
  try {
    await requireSessionUser();

    const { searchParams } = new URL(request.url);
    const { query } = userLookupSchema.parse({
      query: searchParams.get("query"),
    });

    const user = await userService.findUserByUsernameOrEmail(query);

    return success(user);
  } catch (routeError) {
    return handleRouteError(routeError);
  }
};
