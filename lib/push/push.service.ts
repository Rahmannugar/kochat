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
    if (userIds.length === 0 || !ensureWebPushConfigured()) {
      return
    }

    const subscriptions = await db.query.pushSubscriptions.findMany({
      where: inArray(pushSubscriptions.userId, userIds),
    })

    if (subscriptions.length === 0) {
      return
    }

    const serializedPayload = JSON.stringify({
      icon: appIcon,
      badge: appIcon,
      ...payload,
    })

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
        } catch (error) {
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
        }
      }),
    )
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
      return
    }

    const memberships = await roomRepository.listActiveMembershipsByRoomId(roomId)
    const activeUserIds = new Set(
      realtimeState.getRoomSnapshot(roomId).activeUsers.map((activeUser) => activeUser.userId),
    )

    const recipientUserIds = memberships
      .map((membership) => membership.userId)
      .filter((userId) => userId !== senderUserId && !activeUserIds.has(userId))

    if (recipientUserIds.length === 0) {
      return
    }

    await pushService.sendToUsers({
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
  },
}
