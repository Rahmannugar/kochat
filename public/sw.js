const STATIC_CACHE = "kochat-static-v1"
const RUNTIME_CACHE = "kochat-runtime-v1"
const OFFLINE_URL = "/offline.html"
const STATIC_ASSETS = [
  OFFLINE_URL,
  "/manifest.webmanifest",
  "/images/kochat-logo.png",
  "/icon.ico",
]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS)),
  )
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== RUNTIME_CACHE)
          .map((key) => caches.delete(key)),
      ),
    ),
  )
  self.clients.claim()
})

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return
  }

  const requestUrl = new URL(event.request.url)

  if (requestUrl.origin !== self.location.origin) {
    return
  }

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const responseClone = response.clone()
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(event.request, responseClone)
          })
          return response
        })
        .catch(async () => {
          const cachedResponse = await caches.match(event.request)

          if (cachedResponse) {
            return cachedResponse
          }

          return caches.match(OFFLINE_URL)
        }),
    )
    return
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse
      }

      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== "basic") {
          return response
        }

        const responseClone = response.clone()
        caches.open(RUNTIME_CACHE).then((cache) => {
          cache.put(event.request, responseClone)
        })
        return response
      })
    }),
  )
})

self.addEventListener("push", (event) => {
  if (!event.data) {
    return
  }

  const payload = event.data.json()
  const title = payload.title || "Kochat"

  event.waitUntil(
    self.registration.showNotification(title, {
      body: payload.body,
      icon: payload.icon || "/images/kochat-logo.png",
      badge: payload.badge || "/images/kochat-logo.png",
      tag: payload.tag,
      data: payload.data,
    }),
  )
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  const targetUrl = event.notification.data?.url || "/dashboard"

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const matchingClient = clients.find((client) => "focus" in client)

      if (matchingClient) {
        matchingClient.navigate(targetUrl)
        return matchingClient.focus()
      }

      return self.clients.openWindow(targetUrl)
    }),
  )
})
