"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { ArrowLeftIcon, UsersThreeIcon, WifiHighIcon } from "@phosphor-icons/react"
import { CursorPagination } from "@/components/shared/CursorPagination"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useRoomMembers } from "@/lib/rooms/useRoomMembers"
import type { RoomListItem, RoomMemberListItem } from "@/lib/rooms/room.client.types"
import type { ActiveUser } from "@/lib/realtime/realtime-event.types"
import { cn } from "@/lib/utils"

type RoomMembersPanelProps = {
  room: RoomListItem["room"]
  activeUsers: ActiveUser[]
  currentUserId: string
  onBack: () => void
}

const getInitials = (value: string | null | undefined) =>
  (value ?? "K")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")

const getProfileHref = (member: RoomMemberListItem, currentUserId: string) =>
  member.user.id === currentUserId ? "/profile" : `/users/${member.user.id}`

export const RoomMembersPanel = ({
  room,
  activeUsers,
  currentUserId,
  onBack,
}: RoomMembersPanelProps) => {
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useRoomMembers({
    roomId: room.id,
  })
  const pages = data?.pages ?? []
  const [pageIndex, setPageIndex] = useState(0)
  const members = pages[pageIndex]?.items ?? []
  const activeUserIds = useMemo(
    () => new Set(activeUsers.map((activeUser) => activeUser.userId)),
    [activeUsers],
  )
  const canGoBack = pageIndex > 0
  const canGoNext = pageIndex < pages.length - 1 || Boolean(hasNextPage)
  useEffect(() => {
    if (pageIndex > 0 && pageIndex >= pages.length) {
      setPageIndex(Math.max(0, pages.length - 1))
    }
  }, [pageIndex, pages.length])

  const handleNextPage = async () => {
    if (pageIndex < pages.length - 1) {
      setPageIndex((current) => current + 1)
      return
    }

    if (!hasNextPage || isFetchingNextPage) {
      return
    }

    const result = await fetchNextPage()

    if (result.data?.pages.length && pageIndex < result.data.pages.length - 1) {
      setPageIndex((current) => current + 1)
    }
  }

  return (
    <div className="flex min-h-[580px] min-w-0 overflow-hidden flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-[1.5rem] border border-border/60 bg-muted/15 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <UsersThreeIcon size={18} weight="bold" className="text-primary" />
            Room members
          </p>
            <p className="mt-1 truncate text-xs text-muted-foreground">
            {room.type === "dm"
              ? "Browse everyone in this direct conversation."
              : `Browse who is inside ${room.displayName}.`}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          className="w-full rounded-full sm:w-auto"
          onClick={onBack}
        >
          <ArrowLeftIcon size={16} weight="bold" />
          Back to messages
        </Button>
      </div>

      <div className="min-h-0 min-w-0 flex-1 overflow-hidden rounded-[1.75rem] border border-border/60 bg-muted/20 p-4 md:p-5">
        <div className="space-y-3">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-20 rounded-[1.35rem] border border-border/60 bg-background/80"
              />
            ))
          ) : members.length > 0 ? (
            members.map((member) => {
              const isActive = activeUserIds.has(member.user.id) || member.user.id === currentUserId

              return (
                <Link
                  key={member.id}
                  href={getProfileHref(member, currentUserId)}
                  className="flex min-w-0 w-full overflow-hidden flex-col gap-3 rounded-[1.35rem] border border-border/60 bg-background/85 px-4 py-3 transition-colors hover:bg-muted/30 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <Avatar size="sm">
                      <AvatarImage src={member.user.image ?? undefined} alt={member.user.name} />
                      <AvatarFallback>{getInitials(member.user.name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{member.user.name}</p>
                      <p className="truncate break-all text-xs text-muted-foreground">
                        {member.user.username ? `@${member.user.username}` : member.user.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex min-w-0 w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
                    {isActive ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                        <WifiHighIcon size={12} weight="bold" />
                        Active
                      </span>
                    ) : null}
                    <span
                      className={cn(
                        "rounded-full px-2 py-1 text-[11px] font-medium uppercase tracking-[0.16em]",
                        member.role === "owner"
                          ? "bg-primary/10 text-foreground"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {member.role}
                    </span>
                  </div>
                </Link>
              )
            })
          ) : (
            <div className="rounded-[1.35rem] border border-dashed border-border/70 bg-background/70 p-5 text-sm text-muted-foreground">
              No members found for this room.
            </div>
          )}

          {pages.length > 0 ? (
            <CursorPagination
              canGoBack={canGoBack}
              canGoNext={canGoNext}
              isBusy={isFetchingNextPage}
              backLabel="Previous"
              nextLabel="Next"
              onBack={() => setPageIndex((current) => Math.max(0, current - 1))}
              onNext={() => void handleNextPage()}
            />
          ) : null}
        </div>
      </div>
    </div>
  )
}
