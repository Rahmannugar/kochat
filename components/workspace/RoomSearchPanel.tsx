"use client"

import { useState } from "react"
import {
  MagnifyingGlassIcon,
  QuotesIcon,
  WaveformIcon,
  XIcon,
} from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useRoomMessageSearch } from "@/lib/messages/useRoomMessageSearch"
import type { SearchMessageResult } from "@/lib/messages/message.client.types"

const HighlightedSnippet = ({
  result,
}: {
  result: SearchMessageResult
}) => {
  const primaryMatch = result.matches[0]

  return (
    <p className="text-sm leading-6 text-muted-foreground">
      {primaryMatch.before}
      <mark className="rounded bg-amber-300/60 px-1 text-foreground dark:bg-amber-400/30">
        {primaryMatch.match}
      </mark>
      {primaryMatch.after}
    </p>
  )
}

type RoomSearchPanelProps = {
  roomId: string
}

export const RoomSearchPanel = ({ roomId }: RoomSearchPanelProps) => {
  const [query, setQuery] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const searchQuery = useRoomMessageSearch({
    roomId,
    query,
    enabled: isOpen,
  })

  return (
    <div className="rounded-[1.5rem] border border-border/60 bg-muted/15 p-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <MagnifyingGlassIcon
            size={16}
            weight="bold"
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={query}
            onFocus={() => setIsOpen(true)}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search messages in this room"
            className="h-11 rounded-full border-border/70 bg-background pl-10 pr-4"
          />
        </div>

        {isOpen ? (
          <Button
            type="button"
            variant="ghost"
            className="rounded-full"
            onClick={() => {
              setIsOpen(false)
              setQuery("")
            }}
          >
            <XIcon size={16} weight="bold" />
            Close
          </Button>
        ) : null}
      </div>

      {isOpen ? (
        <div className="mt-3 overflow-hidden rounded-[1.25rem] border border-border/60 bg-background/80">
          <ScrollArea className="max-h-72">
            <div className="space-y-2 p-3">
              {!query.trim() ? (
                <div className="rounded-[1rem] border border-dashed border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
                  Start typing to search message text and voice transcripts in this room.
                </div>
              ) : searchQuery.isLoading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-20 rounded-[1rem] border border-border/50 bg-muted/25"
                  />
                ))
              ) : searchQuery.data && searchQuery.data.length > 0 ? (
                searchQuery.data.map((result) => (
                  <div
                    key={result.message.id}
                    className="rounded-[1rem] border border-border/60 bg-background px-4 py-3"
                  >
                    <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      {result.matches[0]?.field === "audioTranscript" ? (
                        <WaveformIcon size={14} weight="bold" />
                      ) : (
                        <QuotesIcon size={14} weight="bold" />
                      )}
                      <span>
                        {result.message.sender === "ai"
                          ? "Kochat AI"
                          : result.message.senderUser?.name || result.message.senderUser?.username || "Unknown user"}
                      </span>
                    </div>
                    <HighlightedSnippet result={result} />
                  </div>
                ))
              ) : (
                <div className="rounded-[1rem] border border-dashed border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
                  No messages matched that search.
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      ) : null}
    </div>
  )
}
