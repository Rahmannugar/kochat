"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import EmojiPicker, { Theme } from "emoji-picker-react"
import {
  CameraIcon,
  SmileyIcon,
  ImageIcon,
  MicrophoneIcon,
  PaperPlaneTiltIcon,
  StopIcon,
  UploadSimpleIcon,
  XIcon,
} from "@phosphor-icons/react"
import { useTheme } from "next-themes"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"
import { useRoomTyping } from "@/lib/rooms/useRoomTyping"
import { useRoomComposer } from "@/lib/rooms/useRoomComposer"
import type { AuthUser } from "@/lib/auth/auth.types"
import {
  AI_USAGE_MAX_REQUESTS_PER_WINDOW,
  AI_USAGE_WINDOW_MS,
} from "@/lib/ai/ai.config"
import {
  CHAT_AUDIO_ALLOWED_MIME_TYPES,
  CHAT_AUDIO_MAX_SIZE_BYTES,
  CHAT_IMAGE_ALLOWED_MIME_TYPES,
  CHAT_IMAGE_MAX_SIZE_BYTES,
} from "@/lib/storage/storage.constants"

type RoomComposerProps = {
  roomId: string
  user: AuthUser
  onAiTrigger: (messageId: string) => Promise<unknown>
}

type PendingImage = {
  id: string
  file: File
  previewUrl: string
}

type PendingAudio = {
  file: File
  label: string
}

const MAX_PENDING_IMAGES = 4
const AI_INVOCATION_PATTERN = /(^|\s)@ai\b/i

const createPendingId = () => crypto.randomUUID()
const normalizeMimeType = (mimeType: string) =>
  mimeType.split(";")[0]?.trim().toLowerCase() || mimeType

const formatBytes = (value: number) => {
  const mb = value / 1024 / 1024

  return `${mb.toFixed(mb >= 10 ? 0 : 1)}MB`
}

const formatDuration = (valueMs: number) => {
  const totalSeconds = Math.max(0, Math.floor(valueMs / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${minutes}:${String(seconds).padStart(2, "0")}`
}

export const RoomComposer = ({ roomId, user, onAiTrigger }: RoomComposerProps) => {
  const { resolvedTheme } = useTheme()
  const imageInputRef = useRef<HTMLInputElement | null>(null)
  const cameraInputRef = useRef<HTMLInputElement | null>(null)
  const audioInputRef = useRef<HTMLInputElement | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const cameraStreamRef = useRef<MediaStream | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])

  const [message, setMessage] = useState("")
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([])
  const [pendingAudio, setPendingAudio] = useState<PendingAudio | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const [recordingStartedAt, setRecordingStartedAt] = useState<number | null>(null)
  const [recordingElapsedMs, setRecordingElapsedMs] = useState(0)

  const {
    isSendingMessage,
    isUploadingImage,
    isUploadingVoice,
    sendComposedMessage,
  } = useRoomComposer({
    roomId,
    onAiTrigger,
  })
  const { notifyTyping } = useRoomTyping({
    roomId,
    user,
  })

  const isBusy = isSendingMessage || isUploadingImage || isUploadingVoice
  const canSend = Boolean(message.trim() || pendingImages.length > 0 || pendingAudio)

  useEffect(() => {
    return () => {
      for (const image of pendingImages) {
        URL.revokeObjectURL(image.previewUrl)
      }

      mediaRecorderRef.current?.stop()
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop())
      cameraStreamRef.current?.getTracks().forEach((track) => track.stop())
    }
  }, [pendingImages])

  useEffect(() => {
    if (!isRecording || !recordingStartedAt) {
      setRecordingElapsedMs(0)
      return
    }

    const interval = window.setInterval(() => {
      setRecordingElapsedMs(Date.now() - recordingStartedAt)
    }, 250)

    return () => window.clearInterval(interval)
  }, [isRecording, recordingStartedAt])

  useEffect(() => {
    if (!isCameraOpen || !videoPreviewRef.current || !cameraStreamRef.current) {
      return
    }

    videoPreviewRef.current.srcObject = cameraStreamRef.current
  }, [isCameraOpen])

  const pendingMediaSummary = useMemo(() => {
    const parts: string[] = []

    if (pendingImages.length > 0) {
      parts.push(`${pendingImages.length} image${pendingImages.length > 1 ? "s" : ""}`)
    }

    if (pendingAudio) {
      parts.push("1 audio")
    }

    return parts.join(" • ")
  }, [pendingAudio, pendingImages.length])

  const resetComposer = () => {
    for (const image of pendingImages) {
      URL.revokeObjectURL(image.previewUrl)
    }

    setMessage("")
    setPendingImages([])
    setPendingAudio(null)
  }

  const addImageFiles = (files: File[]) => {
    if (files.length === 0) {
      return
    }

    const remainingSlots = MAX_PENDING_IMAGES - pendingImages.length

    if (remainingSlots <= 0) {
      toast.error(`You can attach up to ${MAX_PENDING_IMAGES} images at a time.`)
      return
    }

    const acceptedFiles = files.slice(0, remainingSlots)
    const rejectedCount = files.length - acceptedFiles.length

    const nextImages: PendingImage[] = []

    for (const file of acceptedFiles) {
      if (!CHAT_IMAGE_ALLOWED_MIME_TYPES.includes(normalizeMimeType(file.type))) {
        toast.error("Select JPG, PNG, WebP, or GIF images only.")
        continue
      }

      if (file.size > CHAT_IMAGE_MAX_SIZE_BYTES) {
        toast.error(`Images must be ${formatBytes(CHAT_IMAGE_MAX_SIZE_BYTES)} or smaller.`)
        continue
      }

      nextImages.push({
        id: createPendingId(),
        file,
        previewUrl: URL.createObjectURL(file),
      })
    }

    if (rejectedCount > 0) {
      toast.error(`Only ${MAX_PENDING_IMAGES} images can be attached at once.`)
    }

    if (nextImages.length > 0) {
      setPendingImages((current) => [...current, ...nextImages])
    }
  }

  const handleImageSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files ? Array.from(event.target.files) : []

    addImageFiles(files)
    event.target.value = ""
  }

  const insertEmoji = (emoji: string) => {
    const textarea = textareaRef.current

    if (!textarea) {
      setMessage((current) => `${current}${emoji}`)
      return
    }

    const selectionStart = textarea.selectionStart ?? message.length
    const selectionEnd = textarea.selectionEnd ?? message.length
    const nextValue =
      message.slice(0, selectionStart) + emoji + message.slice(selectionEnd)

    setMessage(nextValue)

    requestAnimationFrame(() => {
      textarea.focus()
      const nextCursor = selectionStart + emoji.length
      textarea.setSelectionRange(nextCursor, nextCursor)
    })
  }

  const handleAudioFileSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    if (!CHAT_AUDIO_ALLOWED_MIME_TYPES.includes(normalizeMimeType(file.type))) {
      toast.error("Select MP3, WAV, WebM, OGG, MP4, or M4A audio.")
      event.target.value = ""
      return
    }

    if (file.size > CHAT_AUDIO_MAX_SIZE_BYTES) {
      toast.error(`Audio must be ${formatBytes(CHAT_AUDIO_MAX_SIZE_BYTES)} or smaller.`)
      event.target.value = ""
      return
    }

    setPendingAudio({
      file,
      label: file.name,
    })
    event.target.value = ""
  }

  const closeCamera = () => {
    cameraStreamRef.current?.getTracks().forEach((track) => track.stop())
    cameraStreamRef.current = null
    if (videoPreviewRef.current) {
      videoPreviewRef.current.srcObject = null
    }
    setIsCameraOpen(false)
  }

  const handleRemoveImage = (imageId: string) => {
    setPendingImages((current) => {
      const image = current.find((candidate) => candidate.id === imageId)

      if (image) {
        URL.revokeObjectURL(image.previewUrl)
      }

      return current.filter((candidate) => candidate.id !== imageId)
    })
  }

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error("Voice recording is not supported in this browser.")
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)

      recordedChunksRef.current = []
      mediaStreamRef.current = stream
      mediaRecorderRef.current = recorder

      recorder.addEventListener("dataavailable", (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data)
        }
      })

      recorder.addEventListener("stop", () => {
        const mimeType = normalizeMimeType(recorder.mimeType || "audio/webm")
        const blob = new Blob(recordedChunksRef.current, { type: mimeType })

        if (blob.size === 0) {
          return
        }

        if (blob.size > CHAT_AUDIO_MAX_SIZE_BYTES) {
          toast.error(`Audio must be ${formatBytes(CHAT_AUDIO_MAX_SIZE_BYTES)} or smaller.`)
          return
        }

        const extension = mimeType.includes("ogg")
          ? "ogg"
          : mimeType.includes("wav")
            ? "wav"
            : "webm"

        const file = new File([blob], `voice-${Date.now()}.${extension}`, {
          type: mimeType,
        })

        setPendingAudio({
          file,
          label: "Recorded voice note",
        })

        stream.getTracks().forEach((track) => track.stop())
        mediaStreamRef.current = null
        mediaRecorderRef.current = null
        recordedChunksRef.current = []
        setRecordingStartedAt(null)
        setRecordingElapsedMs(0)
      })

      recorder.start()
      setIsRecording(true)
      setRecordingStartedAt(Date.now())
    } catch {
      toast.error("Microphone access is required to record audio.")
    }
  }

  const stopRecording = () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === "inactive") {
      return
    }

    mediaRecorderRef.current.stop()
    setIsRecording(false)
  }

  const openCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      cameraInputRef.current?.click()
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
        },
      })

      cameraStreamRef.current?.getTracks().forEach((track) => track.stop())
      cameraStreamRef.current = stream
      setIsCameraOpen(true)
    } catch {
      toast.error("Camera access was blocked, so we opened your photo picker instead.")
      cameraInputRef.current?.click()
    }
  }

  const captureCameraImage = async () => {
    const video = videoPreviewRef.current

    if (!video || !cameraStreamRef.current) {
      return
    }

    const canvas = document.createElement("canvas")
    canvas.width = video.videoWidth || 1280
    canvas.height = video.videoHeight || 720
    const context = canvas.getContext("2d")

    if (!context) {
      toast.error("Unable to capture a frame from the camera.")
      return
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.92),
    )

    if (!blob) {
      toast.error("Unable to capture a photo right now.")
      return
    }

    addImageFiles([
      new File([blob], `camera-${Date.now()}.jpg`, {
        type: "image/jpeg",
      }),
    ])
    closeCamera()
  }

  const handleSubmit = async () => {
    const content = message.trim()

    if (!canSend || isBusy || isRecording) {
      return
    }

    try {
      await sendComposedMessage({
        content,
        imageFiles: pendingImages.map((image) => image.file),
        audioFile: pendingAudio?.file ?? null,
        audioLabel: pendingAudio?.label ?? null,
        quiet: true,
      })
      resetComposer()
    } catch {
      // useRoomComposer already raises the relevant toast
    }
  }

  return (
    <div className="rounded-[1.75rem] border border-border/60 bg-background/95 p-4 shadow-sm">
      <input
        ref={imageInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
        multiple
        className="hidden"
        onChange={handleImageSelection}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        capture="environment"
        className="hidden"
        onChange={handleImageSelection}
      />
      <input
        ref={audioInputRef}
        type="file"
        accept="audio/mpeg,audio/mp3,audio/mp4,audio/wav,audio/webm,audio/ogg,audio/x-m4a"
        className="hidden"
        onChange={handleAudioFileSelection}
      />

      <div className="space-y-4">
        {pendingImages.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {pendingImages.map((image) => (
              <div
                key={image.id}
                className="group relative overflow-hidden rounded-[1.25rem] border border-border/70 bg-muted/30"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.previewUrl}
                  alt={image.file.name}
                  className="aspect-square w-full object-cover"
                />
                <button
                  type="button"
                  className="absolute right-2 top-2 inline-flex size-7 items-center justify-center rounded-full bg-black/65 text-white transition-opacity hover:opacity-85"
                  onClick={() => handleRemoveImage(image.id)}
                  aria-label={`Remove ${image.file.name}`}
                >
                  <XIcon size={14} weight="bold" />
                </button>
              </div>
            ))}
          </div>
        ) : null}

        {pendingAudio ? (
          <div className="flex items-center justify-between rounded-[1.25rem] border border-border/70 bg-muted/25 px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{pendingAudio.label}</p>
              <p className="text-xs text-muted-foreground">
                Audio ready to send
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={() => setPendingAudio(null)}
              aria-label="Remove audio"
            >
              <XIcon size={16} weight="bold" />
            </Button>
          </div>
        ) : null}

        {isRecording ? (
          <div className="flex items-center justify-between rounded-[1.25rem] border border-red-400/30 bg-red-500/5 px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="inline-flex size-2.5 rounded-full bg-red-500" />
              <div className="min-w-0">
                <p className="text-sm font-medium">Recording voice note</p>
                <p className="text-xs text-muted-foreground">
                  {formatDuration(recordingElapsedMs)}
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="rounded-full"
              onClick={stopRecording}
            >
              <StopIcon size={16} weight="fill" />
              Stop
            </Button>
          </div>
        ) : null}

        {isCameraOpen ? (
          <div className="overflow-hidden rounded-[1.5rem] border border-border/70 bg-muted/20">
            <div className="aspect-[4/3] bg-black">
              <video
                ref={videoPreviewRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 p-3">
              <p className="text-xs text-muted-foreground">
                Capture a photo and add it to this message before sending.
              </p>
              <div className="flex items-center gap-2">
                <Button type="button" variant="ghost" className="rounded-full" onClick={closeCamera}>
                  Cancel
                </Button>
                <Button type="button" className="rounded-full" onClick={() => void captureCameraImage()}>
                  <CameraIcon size={16} weight="bold" />
                  Use photo
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        <div className="rounded-[1.5rem] border border-border/70 bg-muted/20 p-2">
          <Textarea
            ref={textareaRef}
            rows={3}
            value={message}
            placeholder="Write a message. Use @ai when you want help in-thread."
            className="min-h-24 border-0 bg-transparent px-2 py-2 text-sm leading-6 shadow-none focus-visible:ring-0"
            onChange={(event) => {
              setMessage(event.target.value)
              notifyTyping()
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault()
                void handleSubmit()
              }
            }}
          />

          <div className="mt-3 flex flex-col gap-3 border-t border-border/60 pt-3">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="rounded-full"
                disabled={isBusy || isRecording || pendingImages.length >= MAX_PENDING_IMAGES}
                onClick={() => imageInputRef.current?.click()}
                aria-label="Attach images"
              >
                <ImageIcon size={18} weight="bold" />
              </Button>
              <Popover>
                <PopoverTrigger
                  render={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="rounded-full"
                      disabled={isBusy || isRecording}
                      aria-label="Insert emoji"
                    />
                  }
                >
                  <SmileyIcon size={18} weight="bold" />
                </PopoverTrigger>
                <PopoverContent className="w-auto rounded-[1.25rem] p-0">
                  <EmojiPicker
                    theme={resolvedTheme === "dark" ? Theme.DARK : Theme.LIGHT}
                    skinTonesDisabled
                    searchDisabled
                    previewConfig={{ showPreview: false }}
                    lazyLoadEmojis
                    onEmojiClick={(emojiData) => insertEmoji(emojiData.emoji)}
                  />
                </PopoverContent>
              </Popover>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="rounded-full"
                disabled={isBusy || isRecording || pendingImages.length >= MAX_PENDING_IMAGES}
                onClick={() => void openCamera()}
                aria-label="Open camera"
              >
                <CameraIcon size={18} weight="bold" />
              </Button>
              <Button
                type="button"
                variant={isRecording ? "destructive" : "ghost"}
                size="icon"
                className="rounded-full"
                disabled={isBusy}
                onClick={() => {
                  if (isRecording) {
                    stopRecording()
                    return
                  }

                  void startRecording()
                }}
                aria-label={isRecording ? "Stop recording" : "Record audio"}
              >
                {isRecording ? <StopIcon size={18} weight="fill" /> : <MicrophoneIcon size={18} weight="bold" />}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="rounded-full"
                disabled={isBusy || isRecording}
                onClick={() => audioInputRef.current?.click()}
                aria-label="Attach audio file"
              >
                <UploadSimpleIcon size={18} weight="bold" />
              </Button>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                {pendingMediaSummary || "Attach up to 4 images, record audio, or choose an audio file."}
              </p>

              <Button
                type="button"
                className="h-11 rounded-full px-4"
                disabled={!canSend || isBusy || isRecording}
                onClick={() => {
                  void handleSubmit()
                }}
              >
                <PaperPlaneTiltIcon size={18} weight="fill" />
                {isSendingMessage
                  ? "Sending..."
                  : isUploadingImage
                    ? "Uploading..."
                    : isUploadingVoice
                      ? "Sending..."
                      : "Send"}
              </Button>
            </div>
          </div>
        </div>

        <p className="px-1 text-xs text-muted-foreground">
          Press <span className="font-medium text-foreground">Enter</span> to send and{" "}
          <span className="font-medium text-foreground">Shift + Enter</span> for a new line.
        </p>
        <p className="px-1 text-[11px] text-muted-foreground">
          AI actions are limited to {AI_USAGE_MAX_REQUESTS_PER_WINDOW} requests every{" "}
          {Math.round(AI_USAGE_WINDOW_MS / (60 * 60 * 1000))} hour.
        </p>
      </div>
    </div>
  )
}
