"use client"

import { useEffect, useState } from "react"
import { apiClient } from "@/lib/utils/client"

type PushConfigResponse = {
  data: {
    supported: boolean
    publicKey: string | null
  }
}

const urlBase64ToUint8Array = (value: string) => {
  const padding = "=".repeat((4 - (value.length % 4)) % 4)
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = window.atob(base64)

  return Uint8Array.from([...rawData].map((character) => character.charCodeAt(0)))
}

const toSubscriptionPayload = (subscription: PushSubscription) => {
  const rawKey = subscription.getKey("p256dh")
  const rawAuth = subscription.getKey("auth")

  if (!rawKey || !rawAuth) {
    throw new Error("Push subscription keys are unavailable")
  }

  return {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: btoa(String.fromCharCode(...new Uint8Array(rawKey))),
      auth: btoa(String.fromCharCode(...new Uint8Array(rawAuth))),
    },
  }
}

export const usePushNotifications = () => {
  const [isSupported, setIsSupported] = useState(false)
  const [isConfigured, setIsConfigured] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>("default")
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    setPermission(Notification.permission)

    const bootstrap = async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setIsSupported(false)
        return
      }

      setIsSupported(true)

      const config = await apiClient.get<PushConfigResponse>("/push/subscription")
      setIsConfigured(config.data.supported && Boolean(config.data.publicKey))

      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      setIsSubscribed(Boolean(subscription))
    }

    void bootstrap().catch(() => {
      setError("Unable to initialize push notifications")
    })
  }, [])

  const enableNotifications = async () => {
    setIsPending(true)
    setError(null)

    try {
      const config = await apiClient.get<PushConfigResponse>("/push/subscription")

      if (!config.data.supported || !config.data.publicKey) {
        throw new Error("Push notifications are not configured on this app")
      }

      const nextPermission = await Notification.requestPermission()
      setPermission(nextPermission)

      if (nextPermission !== "granted") {
        throw new Error("Notification permission was not granted")
      }

      const registration = await navigator.serviceWorker.ready
      let subscription = await registration.pushManager.getSubscription()

      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(config.data.publicKey),
        })
      }

      await apiClient.post("/push/subscription", toSubscriptionPayload(subscription))
      setIsSubscribed(true)
    } catch (pushError) {
      setError(pushError instanceof Error ? pushError.message : "Unable to enable notifications")
      throw pushError
    } finally {
      setIsPending(false)
    }
  }

  const disableNotifications = async () => {
    setIsPending(true)
    setError(null)

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        await apiClient.delete("/push/subscription", {
          endpoint: subscription.endpoint,
        })
        await subscription.unsubscribe()
      }

      setIsSubscribed(false)
    } catch (pushError) {
      setError(pushError instanceof Error ? pushError.message : "Unable to disable notifications")
      throw pushError
    } finally {
      setIsPending(false)
    }
  }

  return {
    isSupported,
    isConfigured,
    permission,
    isSubscribed,
    isPending,
    error,
    enableNotifications,
    disableNotifications,
  }
}
