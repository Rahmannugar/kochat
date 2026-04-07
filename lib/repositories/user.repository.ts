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

  findByUsername: async (username: string) => {
    return db.query.user.findFirst({
      where: eq(user.username, username),
    })
  },

  findByEmail: async (email: string) => {
    return db.query.user.findFirst({
      where: eq(user.email, email),
    })
  },

  findByUsernameOrEmail: async (value: string) => {
    return db.query.user.findFirst({
      where: or(eq(user.username, value), eq(user.email, value)),
    })
  },

  updateProfileFields: async ({
    userId,
    name,
    image,
    username,
    bio,
  }: UpdateUserProfileInput) => {
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
