"use client"

import { useEffect } from "react"

export const PwaRegistration = () => {
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      (process.env.NODE_ENV !== "production" && window.location.hostname !== "localhost")
    ) {
      return
    }

    void navigator.serviceWorker.register("/sw.js")
  }, [])

  return null
}
