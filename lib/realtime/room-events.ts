import { getServerEnv } from "@/lib/env/server"
import { RoomEvent } from "@/lib/realtime/realtime.types"

const getRoomTopic = (roomId: string) => `room:${roomId}`

export const roomEvents = {
  publish: async <TPayload>(event: Omit<RoomEvent<TPayload>, "occurredAt"> & { occurredAt?: string }) => {
    const env = getServerEnv()
    const payload = {
      ...event,
      occurredAt: event.occurredAt ?? new Date().toISOString(),
    }

    const response = await fetch(
      `${env.NEXT_PUBLIC_SUPABASE_URL}/realtime/v1/api/broadcast`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [
            {
              topic: getRoomTopic(event.roomId),
              event: event.type,
              payload,
              private: true,
            },
          ],
        }),
      },
    )

    if (!response.ok) {
      const errorBody = await response.text()
      throw new Error(`Failed to broadcast realtime room event: ${errorBody || response.statusText}`)
    }
  },
}
