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
  const [hasHydrated, setHasHydrated] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [isConfigured, setIsConfigured] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>("default")
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    setHasHydrated(true)
    setPermission(Notification.permission)

    const bootstrap = async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setIsSupported(false)
        setIsInitializing(false)
        return
      }

      setIsSupported(true)

      const config = await apiClient.get<PushConfigResponse>("/push/subscription")
      setIsConfigured(config.data.supported && Boolean(config.data.publicKey))

      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      setIsSubscribed(Boolean(subscription))
      setIsInitializing(false)
    }

    void bootstrap().catch(() => {
      setError("Unable to initialize push notifications")
      setIsInitializing(false)
    })
  }, [])

  const enableNotifications = async () => {
    if (isPending) {
      return false
    }

    setIsPending(true)
    setError(null)

    try {
      const config = await apiClient.get<PushConfigResponse>("/push/subscription")

      if (!config.data.supported || !config.data.publicKey) {
        setError("Push notifications are not configured on this app")
        return false
      }

      if (Notification.permission === "denied") {
        setPermission("denied")
        setError("Notifications are blocked in your browser settings. Enable them for this site and refresh.")
        return false
      }

      const nextPermission =
        Notification.permission === "granted"
          ? "granted"
          : await Notification.requestPermission()
      setPermission(nextPermission)

      if (nextPermission !== "granted") {
        setError("Notifications are blocked in your browser settings. Enable them for this site and refresh.")
        return false
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
      return true
    } catch (pushError) {
      setError(pushError instanceof Error ? pushError.message : "Unable to enable notifications")
      return false
    } finally {
      setIsPending(false)
    }
  }

  const disableNotifications = async () => {
    if (isPending) {
      return false
    }

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
      return true
    } catch (pushError) {
      setError(pushError instanceof Error ? pushError.message : "Unable to disable notifications")
      return false
    } finally {
      setIsPending(false)
    }
  }

  return {
    hasHydrated,
    isSupported,
    isConfigured,
    permission,
    isSubscribed,
    isInitializing,
    isPending,
    error,
    enableNotifications,
    disableNotifications,
  }
}
