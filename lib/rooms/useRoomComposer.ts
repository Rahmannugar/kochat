"use client"

import { useCallback, useState } from "react"
import { toast } from "sonner"
import type { RoomEventMessage } from "@/lib/messages/message.client.types"
import {
  CHAT_AUDIO_ALLOWED_MIME_TYPES,
  CHAT_AUDIO_MAX_SIZE_BYTES,
  CHAT_IMAGE_ALLOWED_MIME_TYPES,
  CHAT_IMAGE_MAX_SIZE_BYTES,
} from "@/lib/storage/storage.constants"
import { apiClient, ApiError } from "@/lib/utils/client"

type ApiResponse<T> = {
  data: T
}

const normalizeMimeType = (mimeType: string) =>
  mimeType.split(";")[0]?.trim().toLowerCase() || mimeType

type CreateMessageResponse = {
  message: RoomEventMessage
  invokesAi: boolean
}

const getApiErrorMessage = (
  fallbackMessage: string,
  error: unknown,
) => {
  if (error instanceof ApiError) {
    const data = error.data

    if (
      data &&
      typeof data === "object" &&
      "error" in data &&
      data.error &&
      typeof data.error === "object" &&
      "message" in data.error &&
      typeof data.error.message === "string"
    ) {
      return data.error.message
    }

    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return fallbackMessage
}

export const useRoomComposer = ({
  roomId,
  onAiTrigger,
}: {
  roomId?: string
  onAiTrigger?: (messageId: string) => Promise<unknown>
}) => {
  const [isSendingMessage, setIsSendingMessage] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [isUploadingVoice, setIsUploadingVoice] = useState(false)

  const sendTextMessage = useCallback(
    async (
      content: string,
      options?: {
        quiet?: boolean
      },
    ) => {
      if (!roomId) {
        throw new Error("Room is required")
      }

      setIsSendingMessage(true)

      try {
        const response = await apiClient.post<ApiResponse<CreateMessageResponse>>(
          `/rooms/${roomId}/messages`,
          { content },
        )

        if (response.data.invokesAi && onAiTrigger) {
          void onAiTrigger(response.data.message.id).catch(() => {
            toast.error("AI couldn’t respond right now.")
          })
        }

        return response.data.message
      } catch (error) {
        const message = getApiErrorMessage("Unable to send your message.", error)
        if (!options?.quiet) {
          toast.error(message)
        }
        throw error
      } finally {
        setIsSendingMessage(false)
      }
    },
    [onAiTrigger, roomId],
  )

  const sendImageMessage = useCallback(
    async ({
      file,
      content,
      quiet,
    }: {
      file: File
      content?: string
      quiet?: boolean
    }) => {
      if (!roomId) {
        throw new Error("Room is required")
      }

      if (!CHAT_IMAGE_ALLOWED_MIME_TYPES.includes(normalizeMimeType(file.type))) {
        const message = "Select a JPG, PNG, WebP, or GIF image."
        toast.error(message)
        throw new Error(message)
      }

      if (file.size > CHAT_IMAGE_MAX_SIZE_BYTES) {
        const message = "Images must be 10MB or smaller."
        toast.error(message)
        throw new Error(message)
      }

      setIsUploadingImage(true)

      try {
        const formData = new FormData()
        formData.append("file", file)

        if (content?.trim()) {
          formData.append("content", content.trim())
        }

        const response = await apiClient.post<
          ApiResponse<{
            upload: {
              publicUrl: string
            }
            message: RoomEventMessage
          }>
        >(`/rooms/${roomId}/messages/image`, formData)

        if (!quiet) {
          toast.success("Image sent.")
        }
        return response.data.message
      } catch (error) {
        const message = getApiErrorMessage("Unable to send image.", error)
        if (!quiet) {
          toast.error(message)
        }
        throw error
      } finally {
        setIsUploadingImage(false)
      }
    },
    [roomId],
  )

  const sendVoiceMessage = useCallback(
    async (
      file: File,
      options?: {
        quiet?: boolean
      },
    ) => {
      if (!roomId) {
        throw new Error("Room is required")
      }

      if (!CHAT_AUDIO_ALLOWED_MIME_TYPES.includes(normalizeMimeType(file.type))) {
        const message = "Select an MP3, WAV, WebM, OGG, or M4A audio file."
        toast.error(message)
        throw new Error(message)
      }

      if (file.size > CHAT_AUDIO_MAX_SIZE_BYTES) {
        const message = "Audio files must be 5MB or smaller."
        toast.error(message)
        throw new Error(message)
      }

      setIsUploadingVoice(true)

      try {
        const formData = new FormData()
        formData.append("file", file)

        const response = await apiClient.post<
          ApiResponse<{
            message: RoomEventMessage
          }>
        >(`/rooms/${roomId}/messages/voice`, formData)

        if (!options?.quiet) {
          toast.success("Voice message sent.")
        }
        return response.data.message
      } catch (error) {
        const message = getApiErrorMessage("Unable to send voice message.", error)
        if (!options?.quiet) {
          toast.error(message)
        }
        throw error
      } finally {
        setIsUploadingVoice(false)
      }
    },
    [roomId],
  )

  const sendComposedMessage = useCallback(
    async ({
      content,
      imageFiles,
      audioFile,
      audioLabel,
      quiet,
    }: {
      content?: string
      imageFiles?: File[]
      audioFile?: File | null
      audioLabel?: string | null
      quiet?: boolean
    }) => {
      if (!roomId) {
        throw new Error("Room is required")
      }

      const trimmedContent = content?.trim() ?? ""
      const normalizedImages = imageFiles ?? []

      if (!trimmedContent && normalizedImages.length === 0 && !audioFile) {
        const message = "Add text, images, or audio before sending."
        toast.error(message)
        throw new Error(message)
      }

      for (const file of normalizedImages) {
        if (!CHAT_IMAGE_ALLOWED_MIME_TYPES.includes(normalizeMimeType(file.type))) {
          const message = "Select a JPG, PNG, WebP, or GIF image."
          toast.error(message)
          throw new Error(message)
        }

        if (file.size > CHAT_IMAGE_MAX_SIZE_BYTES) {
          const message = "Images must be 10MB or smaller."
          toast.error(message)
          throw new Error(message)
        }
      }

      if (audioFile) {
        if (!CHAT_AUDIO_ALLOWED_MIME_TYPES.includes(normalizeMimeType(audioFile.type))) {
          const message = "Select an MP3, WAV, WebM, OGG, or M4A audio file."
          toast.error(message)
          throw new Error(message)
        }

        if (audioFile.size > CHAT_AUDIO_MAX_SIZE_BYTES) {
          const message = "Audio files must be 5MB or smaller."
          toast.error(message)
          throw new Error(message)
        }
      }

      setIsSendingMessage(true)
      setIsUploadingImage(normalizedImages.length > 0)
      setIsUploadingVoice(Boolean(audioFile))

      try {
        const formData = new FormData()

        if (trimmedContent) {
          formData.append("content", trimmedContent)
        }

        for (const file of normalizedImages) {
          formData.append("images", file)
        }

        if (audioFile) {
          formData.append("audio", audioFile)

          if (audioLabel?.trim()) {
            formData.append("audioLabel", audioLabel.trim())
          }
        }

        const response = await apiClient.post<ApiResponse<CreateMessageResponse>>(
          `/rooms/${roomId}/messages/compose`,
          formData,
        )

        if (response.data.invokesAi && onAiTrigger) {
          void onAiTrigger(response.data.message.id).catch(() => {
            toast.error("AI couldn’t respond right now.")
          })
        }

        if (!quiet) {
          toast.success("Message sent.")
        }

        return response.data.message
      } catch (error) {
        const message = getApiErrorMessage("Unable to send your message.", error)
        if (!quiet) {
          toast.error(message)
        }
        throw error
      } finally {
        setIsSendingMessage(false)
        setIsUploadingImage(false)
        setIsUploadingVoice(false)
      }
    },
    [onAiTrigger, roomId],
  )

  return {
    isSendingMessage,
    isUploadingImage,
    isUploadingVoice,
    sendComposedMessage,
    sendTextMessage,
    sendImageMessage,
    sendVoiceMessage,
  }
}
