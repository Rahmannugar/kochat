"use client"

import { useEffect } from "react"

export const PwaRegistration = () => {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return
    }

    const manageServiceWorker = async () => {
      if (process.env.NODE_ENV === "production") {
        await navigator.serviceWorker.register("/sw.js")
        return
      }

      const registrations = await navigator.serviceWorker.getRegistrations()
      await Promise.all(
        registrations
          .filter((registration) => registration.active?.scriptURL.endsWith("/sw.js"))
          .map((registration) => registration.unregister()),
      )

      if ("caches" in window) {
        const cacheKeys = await caches.keys()
        await Promise.all(
          cacheKeys
            .filter((cacheKey) => cacheKey.startsWith("kochat-"))
            .map((cacheKey) => caches.delete(cacheKey)),
        )
      }
    }

    void manageServiceWorker()
  }, [])

  return null
}
