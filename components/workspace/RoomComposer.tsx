"use client"

import { useRef, useState } from "react"
import {
  ImageIcon,
  MicrophoneIcon,
  PaperPlaneTiltIcon,
  SparkleIcon,
} from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
  InputGroupText,
} from "@/components/ui/input-group"
import { useRoomTyping } from "@/lib/rooms/useRoomTyping"
import { useRoomComposer } from "@/lib/rooms/useRoomComposer"

type RoomComposerProps = {
  roomId: string
  onAiTrigger: (messageId: string) => Promise<unknown>
}

export const RoomComposer = ({ roomId, onAiTrigger }: RoomComposerProps) => {
  const imageInputRef = useRef<HTMLInputElement | null>(null)
  const audioInputRef = useRef<HTMLInputElement | null>(null)
  const [message, setMessage] = useState("")
  const {
    isSendingMessage,
    isUploadingImage,
    isUploadingVoice,
    sendTextMessage,
    sendImageMessage,
    sendVoiceMessage,
  } = useRoomComposer({
    roomId,
    onAiTrigger,
  })
  const { notifyTyping } = useRoomTyping({
    roomId,
  })

  const isBusy = isSendingMessage || isUploadingImage || isUploadingVoice

  const handleSubmit = async () => {
    const content = message.trim()

    if (!content || isBusy) {
      return
    }

    await sendTextMessage(content)
    setMessage("")
  }

  const handleImageSelection = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0]

    if (!file || isBusy) {
      event.target.value = ""
      return
    }

    await sendImageMessage({
      file,
      content: message,
    })
    setMessage("")
    event.target.value = ""
  }

  const handleVoiceSelection = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0]

    if (!file || isBusy) {
      event.target.value = ""
      return
    }

    await sendVoiceMessage(file)
    event.target.value = ""
  }

  return (
    <div className="rounded-[1.75rem] border border-border/60 bg-background/95 p-4 shadow-sm">
      <input
        ref={imageInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
        className="hidden"
        onChange={(event) => {
          void handleImageSelection(event)
        }}
      />
      <input
        ref={audioInputRef}
        type="file"
        accept="audio/mpeg,audio/mp3,audio/mp4,audio/wav,audio/webm,audio/ogg,audio/x-m4a"
        className="hidden"
        onChange={(event) => {
          void handleVoiceSelection(event)
        }}
      />

      <div className="space-y-3">
        <InputGroup className="h-auto rounded-[1.5rem] border-border/70 bg-muted/20 px-2 py-2">
          <InputGroupTextarea
            rows={3}
            value={message}
            placeholder="Write a message. Use @ai when you want help in-thread."
            className="min-h-24 text-sm leading-6"
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
          <InputGroupAddon
            align="block-end"
            className="mt-2 flex items-center justify-between border-t border-border/60 pt-3"
          >
            <div className="flex items-center gap-2">
              <InputGroupButton
                size="icon-sm"
                variant="ghost"
                className="rounded-full"
                disabled={isBusy}
                onClick={() => imageInputRef.current?.click()}
                aria-label="Send image"
              >
                <ImageIcon size={18} weight="bold" />
              </InputGroupButton>
              <InputGroupButton
                size="icon-sm"
                variant="ghost"
                className="rounded-full"
                disabled={isBusy}
                onClick={() => audioInputRef.current?.click()}
                aria-label="Send voice message"
              >
                <MicrophoneIcon size={18} weight="bold" />
              </InputGroupButton>
              <InputGroupText className="hidden text-xs md:inline-flex">
                <SparkleIcon size={14} weight="fill" className="text-primary" />
                Add <span className="font-semibold text-foreground">@ai</span> to invite AI into the thread.
              </InputGroupText>
            </div>

            <Button
              type="button"
              className="h-11 rounded-full px-4"
              disabled={!message.trim() || isBusy}
              onClick={() => {
                void handleSubmit()
              }}
            >
              <PaperPlaneTiltIcon size={18} weight="fill" />
              {isSendingMessage
                ? "Sending..."
                : isUploadingImage
                  ? "Uploading image..."
                  : isUploadingVoice
                    ? "Sending voice..."
                    : "Send"}
            </Button>
          </InputGroupAddon>
        </InputGroup>

        <p className="px-1 text-xs text-muted-foreground">
          Press <span className="font-medium text-foreground">Enter</span> to send and{" "}
          <span className="font-medium text-foreground">Shift + Enter</span> for a new line.
        </p>
      </div>
    </div>
  )
}
