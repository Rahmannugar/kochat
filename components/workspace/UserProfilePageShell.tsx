"use client"

import Link from "next/link"
import { ArrowLeftIcon } from "@phosphor-icons/react"
import { AppHeader } from "@/components/workspace/AppHeader"
import { RoomListPanel } from "@/components/workspace/RoomListPanel"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { buttonVariants } from "@/components/ui/button"
import type { AuthUser } from "@/lib/auth/auth.types"
import { cn } from "@/lib/utils"

type UserProfilePageShellProps = {
  authUser: AuthUser
  viewedUser: AuthUser
}

const getInitials = (value: string) =>
  value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")

export const UserProfilePageShell = ({
  authUser,
  viewedUser,
}: UserProfilePageShellProps) => {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(160,214,255,0.7),transparent_26%),linear-gradient(180deg,var(--background)_0%,color-mix(in_oklab,var(--background)_92%,white)_100%)] px-4 py-6 dark:bg-[radial-gradient(circle_at_top,rgba(43,84,132,0.35),transparent_18%),linear-gradient(180deg,oklch(0.19_0.02_255)_0%,var(--background)_100%)]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
        <AppHeader />

        <div className="grid gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
          <div className="hidden lg:block">
            <RoomListPanel user={authUser} />
          </div>

          <section className="rounded-[1.75rem] border border-border/70 bg-background/90 p-5 shadow-sm backdrop-blur md:p-6">
            <Link
              href="/dashboard"
              className={cn(
                buttonVariants({
                  variant: "ghost",
                  className: "mb-5 rounded-full px-0 text-muted-foreground",
                }),
              )}
            >
              <ArrowLeftIcon size={18} weight="bold" />
              Back to dashboard
            </Link>

            <div className="rounded-[1.75rem] border border-border/60 bg-muted/20 p-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <Avatar size="lg" className="size-24">
                  <AvatarImage src={viewedUser.image ?? undefined} alt={viewedUser.name} />
                  <AvatarFallback className="text-lg">
                    {getInitials(viewedUser.name)}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0">
                  <p className="truncate text-2xl font-semibold">{viewedUser.name}</p>
                  <p className="mt-1 truncate text-sm text-muted-foreground">
                    {viewedUser.username ? `@${viewedUser.username}` : viewedUser.email}
                  </p>
                  <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">
                    {viewedUser.bio || "No bio added yet."}
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
