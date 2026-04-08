"use client"

import Link from "next/link"
import { ArrowLeftIcon, ChatsCircleIcon, UsersThreeIcon } from "@phosphor-icons/react"
import { AppHeader } from "@/components/workspace/AppHeader"
import { RoomListPanel } from "@/components/workspace/RoomListPanel"
import { RoomPanel } from "@/components/workspace/RoomPanel"
import { buttonVariants } from "@/components/ui/button"
import type { AuthUser } from "@/lib/auth/auth.types"
import type { RoomListItem } from "@/lib/rooms/room.client.types"
import { cn } from "@/lib/utils"

type RoomPageShellProps = {
  user: AuthUser
  room: RoomListItem["room"]
}

export const RoomPageShell = ({ user, room }: RoomPageShellProps) => {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(160,214,255,0.7),transparent_26%),linear-gradient(180deg,var(--background)_0%,color-mix(in_oklab,var(--background)_92%,white)_100%)] px-4 py-6 dark:bg-[radial-gradient(circle_at_top,rgba(43,84,132,0.35),transparent_18%),linear-gradient(180deg,oklch(0.19_0.02_255)_0%,var(--background)_100%)]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
        <AppHeader />

        <div className="lg:hidden">
          <div className="rounded-[1.75rem] border border-border/70 bg-background/90 p-4 shadow-sm backdrop-blur">
            <Link
              href="/dashboard"
              className={cn(
                buttonVariants({
                  variant: "ghost",
                  className: "mb-3 rounded-full px-0 text-muted-foreground",
                }),
              )}
            >
              <ArrowLeftIcon size={18} weight="bold" />
              Back to dashboard
            </Link>

            <div className="flex items-center gap-2">
              {room.type === "group" ? (
                <UsersThreeIcon size={20} weight="bold" className="text-primary" />
              ) : (
                <ChatsCircleIcon size={20} weight="bold" className="text-primary" />
              )}
              <div className="min-w-0">
                <p className="truncate font-semibold">{room.name}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {room.type === "group"
                    ? `Join code: ${room.code}`
                    : "Private direct conversation"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
          <div className="hidden lg:block">
            <RoomListPanel user={user} selectedRoomId={room.id} />
          </div>

          <section className="min-w-0 rounded-[1.75rem] border border-border/70 bg-background/90 p-4 shadow-sm backdrop-blur md:p-6">
            <div className="hidden border-b border-border/60 pb-5 lg:block">
              <div className="mb-4">
                <Link
                  href="/dashboard"
                  className={cn(
                    buttonVariants({
                      variant: "ghost",
                      className: "rounded-full px-0 text-muted-foreground",
                    }),
                  )}
                >
                  <ArrowLeftIcon size={18} weight="bold" />
                  Back to dashboard
                </Link>
              </div>

              <div className="flex items-center gap-3">
                {room.type === "group" ? (
                  <UsersThreeIcon size={22} weight="bold" className="text-primary" />
                ) : (
                  <ChatsCircleIcon size={22} weight="bold" className="text-primary" />
                )}
                <div className="min-w-0">
                  <p className="truncate text-xl font-semibold">{room.name}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {room.type === "group"
                      ? `Join code: ${room.code}`
                      : "Private direct conversation"}
                  </p>
                </div>
              </div>
            </div>

            <div className="min-w-0 pt-0 lg:pt-6">
              <RoomPanel room={room} user={user} />
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
