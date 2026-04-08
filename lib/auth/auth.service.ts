import { userRepository } from "@/lib/users/user.repository";

type BootstrapUserInput = {
  id: string;
  name: string;
  image?: string | null;
};

type AuthFlowDestination = "/sign-in" | "/verify-email" | "/onboarding" | "/dashboard"

export const authService = {
  bootstrapUserAccount: async ({ id, name, image }: BootstrapUserInput) => {
    const currentUser = await userRepository.findById(id);

    if (!currentUser) {
      throw new Error("Authenticated user record was not found");
    }

    const updatedUser = await userRepository.updateProfileFields({
      userId: id,
      name,
      image: image ?? null,
      bio: currentUser.bio,
    });

    return {
      user: updatedUser,
    };
  },

  requiresProfileCompletion: async (userId: string) => {
    const currentUser = await userRepository.findById(userId);

    if (!currentUser) {
      throw new Error("Authenticated user record was not found");
    }

    return !currentUser.username;
  },

  getAuthRoute: async (userId: string): Promise<AuthFlowDestination> => {
    const currentUser = await userRepository.findById(userId)

    if (!currentUser) {
      throw new Error("Authenticated user record was not found")
    }

    if (!currentUser.emailVerified) {
      return "/verify-email"
    }

    return !currentUser.username ? "/onboarding" : "/dashboard"
  },
};
