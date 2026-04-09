import { z } from "zod"
import { pushService } from "@/lib/push/push.service"
import { handleRouteError, requireAppUser, success } from "@/lib/utils/http"

const pushSubscriptionSchema = z.object({
  endpoint: z.string().url("Push endpoint must be a valid URL"),
  keys: z.object({
    p256dh: z.string().min(1, "Missing push public key"),
    auth: z.string().min(1, "Missing push auth key"),
  }),
})

const unsubscribeSchema = z.object({
  endpoint: z.string().url("Push endpoint must be a valid URL"),
})

export const GET = async () => {
  try {
    await requireAppUser()

    return success({
      supported: pushService.isConfigured(),
      publicKey: pushService.getPublicKey(),
    })
  } catch (routeError) {
    return handleRouteError(routeError)
  }
}

export const POST = async (request: Request) => {
  try {
    const sessionUser = await requireAppUser()
    const payload = pushSubscriptionSchema.parse(await request.json())

    await pushService.upsertSubscription({
      userId: sessionUser.id,
      subscription: payload,
      userAgent: request.headers.get("user-agent"),
    })

    return success({ success: true })
  } catch (routeError) {
    return handleRouteError(routeError)
  }
}

export const DELETE = async (request: Request) => {
  try {
    const sessionUser = await requireAppUser()
    const payload = unsubscribeSchema.parse(await request.json())

    await pushService.removeSubscription({
      userId: sessionUser.id,
      endpoint: payload.endpoint,
    })

    return success({ success: true })
  } catch (routeError) {
    return handleRouteError(routeError)
  }
}
