import { Client } from "pg"
import { pool } from "@/lib/db"
import { getServerEnv } from "@/lib/env/server"
import { RoomEvent } from "@/lib/realtime/realtime.types"

const ROOM_EVENTS_CHANNEL = "kochat_room_events"

type RoomSubscriber = (event: RoomEvent) => void

let listenerClientPromise: Promise<Client> | undefined
const roomSubscribers = new Map<string, Set<RoomSubscriber>>()

const deliverEvent = (event: RoomEvent) => {
  const subscribers = roomSubscribers.get(event.roomId)

  if (!subscribers?.size) {
    return
  }

  for (const subscriber of subscribers) {
    subscriber(event)
  }
}

const ensureListenerClient = async () => {
  if (!listenerClientPromise) {
    listenerClientPromise = (async () => {
      const client = new Client({
        connectionString: getServerEnv().DATABASE_URL,
      })

      await client.connect()
      await client.query(`LISTEN ${ROOM_EVENTS_CHANNEL}`)
      client.on("notification", (notification) => {
        if (!notification.payload) {
          return
        }

        try {
          const event = JSON.parse(notification.payload) as RoomEvent
          deliverEvent(event)
        } catch {
          // Ignore malformed notifications so one bad payload doesn't kill the stream fanout.
        }
      })

      client.on("error", () => {
        listenerClientPromise = undefined
      })

      return client
    })()
  }

  return listenerClientPromise
}

export const roomEvents = {
  publish: async <TPayload>(event: Omit<RoomEvent<TPayload>, "occurredAt"> & { occurredAt?: string }) => {
    const payload = JSON.stringify({
      ...event,
      occurredAt: event.occurredAt ?? new Date().toISOString(),
    })

    await pool.query("select pg_notify($1, $2)", [ROOM_EVENTS_CHANNEL, payload])
  },

  subscribe: async (roomId: string, subscriber: RoomSubscriber) => {
    await ensureListenerClient()

    const currentSubscribers = roomSubscribers.get(roomId) ?? new Set<RoomSubscriber>()
    currentSubscribers.add(subscriber)
    roomSubscribers.set(roomId, currentSubscribers)

    return () => {
      const subscribers = roomSubscribers.get(roomId)

      if (!subscribers) {
        return
      }

      subscribers.delete(subscriber)

      if (subscribers.size === 0) {
        roomSubscribers.delete(roomId)
      }
    }
  },
}
