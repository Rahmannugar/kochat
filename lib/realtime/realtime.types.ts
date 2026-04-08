export type RoomEventType =
  | "message.created"
  | "typing.updated"
  | "presence.updated"
  | "receipts.updated"

export type RoomEvent<TPayload = unknown> = {
  roomId: string
  type: RoomEventType
  payload: TPayload
  occurredAt: string
}
