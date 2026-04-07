import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { profiles } from "@/lib/db/schema"

type UpsertProfileInput = {
  userId: string
  displayName: string
  avatarUrl?: string | null
}

export const userRepository = {
  findProfileByUserId: async (userId: string) => {
    return db.query.profiles.findFirst({
      where: eq(profiles.userId, userId),
    })
  },

  upsertProfile: async ({ userId, displayName, avatarUrl }: UpsertProfileInput) => {
    const [profile] = await db
      .insert(profiles)
      .values({
        userId,
        displayName,
        avatarUrl: avatarUrl ?? null,
      })
      .onConflictDoUpdate({
        target: profiles.userId,
        set: {
          displayName,
          avatarUrl: avatarUrl ?? null,
          updatedAt: new Date(),
        },
      })
      .returning()

    return profile
  },
}
import { eq, or } from "drizzle-orm"
import { db } from "@/lib/db"
import { user } from "@/lib/db/schema"

type UpdateUserProfileInput = {
  userId: string
  name: string
  image?: string | null
  username?: string
  bio?: string | null
}

export const userRepository = {
  findById: async (userId: string) => {
    return db.query.user.findFirst({
      where: eq(user.id, userId),
    })
  },

  findByUsernameOrEmail: async (value: string) => {
    return db.query.user.findFirst({
      where: or(eq(user.username, value), eq(user.email, value)),
    })
  },

  updateUserProfile: async ({ userId, name, image, username, bio }: UpdateUserProfileInput) => {
    const [updatedUser] = await db
      .update(user)
      .set({
        name,
        image: image ?? null,
        ...(username ? { username } : {}),
        ...(bio !== undefined ? { bio } : {}),
        updatedAt: new Date(),
      })
      .where(eq(user.id, userId))
      .returning()

    return updatedUser
  },
}
