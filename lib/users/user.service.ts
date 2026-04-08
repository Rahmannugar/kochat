import { userRepository } from "@/lib/users/user.repository";

type UpdateUserProfileInput = {
  userId: string;
  name: string;
  image?: string | null;
  username?: string;
  bio?: string | null;
};

type CompleteOnboardingInput = {
  userId: string;
  name: string;
  username: string;
};

const normalizeLookupValue = (value: string) => value.trim();
const normalizeUsername = (value: string) => value.trim();

export const userService = {
  getUserById: async (userId: string) => {
    const existingUser = await userRepository.findById(userId);

    if (!existingUser) {
      throw new Error("User not found");
    }

    return existingUser;
  },

  findUserByUsernameOrEmail: async (value: string) => {
    const normalizedValue = normalizeLookupValue(value);
    const existingUser =
      await userRepository.findByUsernameOrEmail(normalizedValue);

    if (!existingUser) {
      throw new Error("User not found");
    }

    return existingUser;
  },

  completeOnboarding: async ({
    userId,
    name,
    username,
  }: CompleteOnboardingInput) => {
    const currentUser = await userRepository.findById(userId);

    if (!currentUser) {
      throw new Error("User not found");
    }

    const normalizedUsername = normalizeUsername(username);
    const existingUser =
      await userRepository.findByUsername(normalizedUsername);

    if (existingUser && existingUser.id !== userId) {
      throw new Error("Username is already taken");
    }

    return userRepository.updateProfileFields({
      userId,
      name: name.trim(),
      username: normalizedUsername,
      image: currentUser.image,
      bio: currentUser.bio,
    });
  },

  updateUserProfile: async ({
    userId,
    name,
    image,
    username,
    bio,
  }: UpdateUserProfileInput) => {
    const currentUser = await userRepository.findById(userId);

    if (!currentUser) {
      throw new Error("User not found");
    }

    const normalizedUsername = username
      ? normalizeUsername(username)
      : undefined;

    if (normalizedUsername) {
      const existingUser =
        await userRepository.findByUsername(normalizedUsername);

      if (existingUser && existingUser.id !== userId) {
        throw new Error("Username is already taken");
      }
    }

    return userRepository.updateProfileFields({
      userId,
      name: name.trim(),
      image: image ?? null,
      username: normalizedUsername,
      bio: bio?.trim() || null,
    });
  },

  updateUserAvatar: async ({
    userId,
    image,
  }: {
    userId: string;
    image: string | null;
  }) => {
    const currentUser = await userRepository.findById(userId);

    if (!currentUser) {
      throw new Error("User not found");
    }

    return userRepository.updateProfileFields({
      userId,
      name: currentUser.name,
      image,
      username: currentUser.username ?? undefined,
      bio: currentUser.bio,
    });
  },
};
