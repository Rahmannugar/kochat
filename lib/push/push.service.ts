import webpush from "web-push"
import { and, eq, inArray } from "drizzle-orm"
import { db } from "@/lib/db"
import { pushSubscriptions } from "@/lib/db/schema"
import { getServerEnv } from "@/lib/env/server"
import { realtimeState } from "@/lib/realtime/realtime-state"
import { roomRepository } from "@/lib/rooms/room.repository"

type SubscriptionInput = {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

type PushPayload = {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  data?: Record<string, unknown>
}

let vapidConfigured = false

const getPushConfig = () => {
  const env = getServerEnv()

  if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY || !env.VAPID_SUBJECT) {
    return null
  }

  return {
    subject: env.VAPID_SUBJECT,
    publicKey: env.VAPID_PUBLIC_KEY,
    privateKey: env.VAPID_PRIVATE_KEY,
  }
}

const ensureWebPushConfigured = () => {
  if (vapidConfigured) {
    return true
  }

  const config = getPushConfig()

  if (!config) {
    return false
  }

  webpush.setVapidDetails(config.subject, config.publicKey, config.privateKey)
  vapidConfigured = true
  return true
}

const appIcon = "/images/kochat-logo.png"

const logPushInfo = (message: string, details?: Record<string, unknown>) => {
  console.info(`[push] ${message}`, details ?? {})
}

const logPushWarn = (message: string, details?: Record<string, unknown>) => {
  console.warn(`[push] ${message}`, details ?? {})
}

const logPushError = (message: string, details?: Record<string, unknown>) => {
  console.error(`[push] ${message}`, details ?? {})
}

export const pushService = {
  isConfigured: () => Boolean(getPushConfig()),

  getPublicKey: () => getPushConfig()?.publicKey ?? process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null,

  upsertSubscription: async ({
    userId,
    subscription,
    userAgent,
  }: {
    userId: string
    subscription: SubscriptionInput
    userAgent?: string | null
  }) => {
    await db
      .insert(pushSubscriptions)
      .values({
        userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userAgent: userAgent ?? null,
      })
      .onConflictDoUpdate({
        target: pushSubscriptions.endpoint,
        set: {
          userId,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          userAgent: userAgent ?? null,
          updatedAt: new Date(),
        },
      })
  },

  removeSubscription: async ({
    userId,
    endpoint,
  }: {
    userId: string
    endpoint: string
  }) => {
    await db
      .delete(pushSubscriptions)
      .where(
        and(
          eq(pushSubscriptions.userId, userId),
          eq(pushSubscriptions.endpoint, endpoint),
        ),
      )
  },

  listSubscriptionsForUser: async (userId: string) => {
    return db.query.pushSubscriptions.findMany({
      where: eq(pushSubscriptions.userId, userId),
    })
  },

  sendToUsers: async ({
    userIds,
    payload,
  }: {
    userIds: string[]
    payload: PushPayload
  }) => {
    if (userIds.length === 0) {
      logPushInfo("Skipped send because there were no recipients.")
      return {
        sentCount: 0,
        failureCount: 0,
        skippedCount: 0,
      }
    }

    if (!ensureWebPushConfigured()) {
      logPushWarn("Skipped send because VAPID keys are not configured.", {
        recipientCount: userIds.length,
      })
      return {
        sentCount: 0,
        failureCount: 0,
        skippedCount: userIds.length,
      }
    }

    const subscriptions = await db.query.pushSubscriptions.findMany({
      where: inArray(pushSubscriptions.userId, userIds),
    })

    if (subscriptions.length === 0) {
      logPushInfo("Skipped send because recipients have no stored subscriptions.", {
        recipientCount: userIds.length,
      })
      return {
        sentCount: 0,
        failureCount: 0,
        skippedCount: userIds.length,
      }
    }

    const serializedPayload = JSON.stringify({
      icon: appIcon,
      badge: appIcon,
      ...payload,
    })

    let sentCount = 0
    let failureCount = 0

    await Promise.all(
      subscriptions.map(async (subscription) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: {
                p256dh: subscription.p256dh,
                auth: subscription.auth,
              },
            },
            serializedPayload,
          )
          sentCount += 1
        } catch (error) {
          failureCount += 1
          const statusCode =
            typeof error === "object" &&
            error &&
            "statusCode" in error &&
            typeof (error as { statusCode?: unknown }).statusCode === "number"
              ? (error as { statusCode: number }).statusCode
              : null

          if (statusCode === 404 || statusCode === 410) {
            await db
              .delete(pushSubscriptions)
              .where(eq(pushSubscriptions.endpoint, subscription.endpoint))
          }

          logPushError("Push send failed for subscription.", {
            endpoint: subscription.endpoint,
            userId: subscription.userId,
            statusCode,
            error:
              error instanceof Error
                ? error.message
                : "Unknown push delivery error",
          })
        }
      }),
    )

    logPushInfo("Completed push delivery attempt.", {
      requestedRecipients: userIds.length,
      matchedSubscriptions: subscriptions.length,
      sentCount,
      failureCount,
    })

    return {
      sentCount,
      failureCount,
      skippedCount: Math.max(0, userIds.length - subscriptions.length),
    }
  },

  notifyRoomMembersAboutMessage: async ({
    roomId,
    senderUserId,
    senderName,
    roomName,
    preview,
  }: {
    roomId: string
    senderUserId: string
    senderName: string
    roomName: string
    preview: string
  }) => {
    if (!ensureWebPushConfigured()) {
      logPushWarn("Skipped room notification because push is not configured.", {
        roomId,
      })
      return
    }

    const memberships = await roomRepository.listActiveMembershipsByRoomId(roomId)
    const activeUsers = realtimeState.getRoomSnapshot(roomId).activeUsers
    const activeUserIds = new Set(activeUsers.map((activeUser) => activeUser.userId))

    const recipientUserIds = memberships
      .map((membership) => membership.userId)
      .filter((userId) => userId !== senderUserId && !activeUserIds.has(userId))

    if (recipientUserIds.length === 0) {
      logPushInfo("Skipped room notification because every recipient is active or excluded.", {
        roomId,
        senderUserId,
        memberCount: memberships.length,
        activeUserIds: [...activeUserIds],
      })
      return
    }

    const delivery = await pushService.sendToUsers({
      userIds: recipientUserIds,
      payload: {
        title: senderName,
        body: preview,
        tag: `room:${roomId}`,
        data: {
          roomId,
          url: `/rooms/${roomId}`,
          roomName,
        },
      },
    })

    logPushInfo("Room notification processed.", {
      roomId,
      senderUserId,
      recipientUserIds,
      activeUserIds: activeUsers.map((activeUser) => activeUser.userId),
      delivery,
    })
  },
}
