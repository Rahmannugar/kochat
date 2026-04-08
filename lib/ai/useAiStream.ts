"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { AiStreamEvent } from "@/lib/ai/ai.client.types"

export const useAiStream = (roomId?: string) => {
  const abortControllerRef = useRef<AbortController | null>(null)
  const [streamedText, setStreamedText] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [messageId, setMessageId] = useState<string | null>(null)

  const cancelStream = useCallback(() => {
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
    setIsStreaming(false)
  }, [])

  const startStream = useCallback(
    async (triggerMessageId: string) => {
      if (!roomId) {
        throw new Error("Room id is required to stream AI responses")
      }

      abortControllerRef.current?.abort()
      const abortController = new AbortController()
      abortControllerRef.current = abortController

      setIsStreaming(true)
      setError(null)
      setMessageId(null)
      setStreamedText("")

      const response = await fetch(`/api/rooms/${roomId}/ai/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        signal: abortController.signal,
        body: JSON.stringify({
          triggerMessageId,
        }),
      })

      if (!response.ok || !response.body) {
        setIsStreaming(false)
        throw new Error("Failed to start AI stream")
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""

      try {
        while (true) {
          const { done, value } = await reader.read()

          if (done) {
            break
          }

          buffer += decoder.decode(value, { stream: true })
          const frames = buffer.split("\n\n")
          buffer = frames.pop() ?? ""

          for (const frame of frames) {
            const dataLine = frame
              .split("\n")
              .find((line) => line.startsWith("data: "))

            if (!dataLine) {
              continue
            }

            const payload = JSON.parse(dataLine.slice(6)) as AiStreamEvent

            if (payload.type === "chunk") {
              setStreamedText((current) => current + payload.text)
              continue
            }

            if (payload.type === "done") {
              setMessageId(payload.messageId)
              setStreamedText("")
              setIsStreaming(false)
              abortControllerRef.current = null
              return payload
            }

            if (payload.type === "error") {
              setError(payload.message)
              setIsStreaming(false)
              throw new Error(payload.message)
            }
          }
        }
      } finally {
        if (abortControllerRef.current === abortController) {
          abortControllerRef.current = null
        }

        setIsStreaming(false)
        reader.releaseLock()
      }

      return null
    },
    [roomId],
  )

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()
    }
  }, [])

  const reset = useCallback(() => {
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
    setStreamedText("")
    setIsStreaming(false)
    setError(null)
    setMessageId(null)
  }, [])

  return {
    streamedText,
    isStreaming,
    error,
    messageId,
    startStream,
    cancelStream,
    reset,
  }
}
