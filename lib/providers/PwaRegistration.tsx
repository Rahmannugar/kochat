"use client"

import { useEffect } from "react"

export const PwaRegistration = () => {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return
    }

    const manageServiceWorker = async () => {
      const registrations = await navigator.serviceWorker.getRegistrations()
      await Promise.all(
        registrations
          .filter((registration) => registration.active?.scriptURL.endsWith("/sw.js"))
          .map((registration) => registration.unregister()),
      )

      if (process.env.NODE_ENV !== "production" && "caches" in window) {
        const cacheKeys = await caches.keys()
        await Promise.all(
          cacheKeys
            .filter((cacheKey) => cacheKey.startsWith("kochat-"))
            .map((cacheKey) => caches.delete(cacheKey)),
        )
      }

      const serviceWorkerUrl =
        process.env.NODE_ENV === "production" ? "/sw.js" : "/sw.js?dev=1"

      await navigator.serviceWorker.register(serviceWorkerUrl)
    }

    void manageServiceWorker()
  }, [])

  return null
}
