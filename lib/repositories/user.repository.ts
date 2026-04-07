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
