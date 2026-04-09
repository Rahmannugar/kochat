import { eq, or, sql } from "drizzle-orm"
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
      where: sql`lower(${user.username}) = lower(${username})`,
    })
  },

  findByEmail: async (email: string) => {
    return db.query.user.findFirst({
      where: sql`lower(${user.email}) = lower(${email})`,
    })
  },

  findByUsernameOrEmail: async (value: string) => {
    return db.query.user.findFirst({
      where: or(
        sql`lower(${user.username}) = lower(${value})`,
        sql`lower(${user.email}) = lower(${value})`,
      ),
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
        ...(image !== undefined ? { image } : {}),
        ...(username ? { username } : {}),
        ...(bio !== undefined ? { bio } : {}),
        updatedAt: new Date(),
      })
      .where(eq(user.id, userId))
      .returning()

    return updatedUser
  },
}
