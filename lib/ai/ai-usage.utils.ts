import { sql } from "drizzle-orm"
import { randomUUID } from "node:crypto"
import { AI_USAGE_MAX_REQUESTS_PER_WINDOW, AI_USAGE_WINDOW_MS } from "@/lib/ai/ai.config"
import { db } from "@/lib/db"
import { HttpError } from "@/lib/utils/http"

type AiUsageRow = {
  usage_count: number
}

const getWindowStart = (value = Date.now()) =>
  new Date(Math.floor(value / AI_USAGE_WINDOW_MS) * AI_USAGE_WINDOW_MS)

const getRetryAfterSeconds = (windowStart: Date) => {
  const nextWindowMs = windowStart.getTime() + AI_USAGE_WINDOW_MS

  return Math.max(1, Math.ceil((nextWindowMs - Date.now()) / 1000))
}

export const consumeAiUsage = async (userId: string, cost = 1) => {
  const windowStart = getWindowStart()

  const upsertResult = await db.execute<AiUsageRow>(sql`
    insert into ai_usage (id, user_id, window_start, usage_count, created_at, updated_at)
    values (${randomUUID()}, ${userId}, ${windowStart}, ${cost}, now(), now())
    on conflict (user_id, window_start)
    do update
      set usage_count = ai_usage.usage_count + ${cost},
          updated_at = now()
    where ai_usage.usage_count + ${cost} <= ${AI_USAGE_MAX_REQUESTS_PER_WINDOW}
    returning usage_count
  `)

  const nextCount = upsertResult.rows[0]?.usage_count

  if (typeof nextCount === "number") {
    return {
      usageCount: nextCount,
      remaining: Math.max(0, AI_USAGE_MAX_REQUESTS_PER_WINDOW - nextCount),
      retryAfterSeconds: getRetryAfterSeconds(windowStart),
    }
  }

  const retryAfterSeconds = getRetryAfterSeconds(windowStart)

  throw new HttpError(
    429,
    `AI usage limit reached. Try again in about ${Math.ceil(retryAfterSeconds / 60)} minute${Math.ceil(retryAfterSeconds / 60) === 1 ? "" : "s"}.`,
  )
}
