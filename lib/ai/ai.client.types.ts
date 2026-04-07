export type AiStreamChunkEvent = {
  type: "chunk"
  text: string
}

export type AiStreamDoneEvent = {
  type: "done"
  messageId: string
}

export type AiStreamErrorEvent = {
  type: "error"
  message: string
}

export type AiStreamEvent =
  | AiStreamChunkEvent
  | AiStreamDoneEvent
  | AiStreamErrorEvent
