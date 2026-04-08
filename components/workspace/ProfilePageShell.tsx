"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeftIcon } from "@phosphor-icons/react"
import { AppHeader } from "@/components/workspace/AppHeader"
import { ProfilePanel } from "@/components/workspace/ProfilePanel"
import { RoomListPanel } from "@/components/workspace/RoomListPanel"
import { buttonVariants } from "@/components/ui/button"
import type { AuthUser } from "@/lib/auth/auth.types"
import { cn } from "@/lib/utils"

type ProfilePageShellProps = {
  user: AuthUser
}

export const ProfilePageShell = ({ user }: ProfilePageShellProps) => {
  const [currentUser, setCurrentUser] = useState(user)

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(160,214,255,0.7),transparent_26%),linear-gradient(180deg,var(--background)_0%,color-mix(in_oklab,var(--background)_92%,white)_100%)] px-4 py-6 dark:bg-[radial-gradient(circle_at_top,rgba(43,84,132,0.35),transparent_18%),linear-gradient(180deg,oklch(0.19_0.02_255)_0%,var(--background)_100%)]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
        <AppHeader />

        <div className="lg:hidden">
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

        <div className="grid gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
          <div className="hidden lg:block">
            <RoomListPanel user={currentUser} />
          </div>

          <section className="rounded-[1.75rem] border border-border/70 bg-background/90 p-5 shadow-sm backdrop-blur md:p-6">
            <div className="mb-6">
              <p className="text-xl font-semibold">Profile</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Keep your account details and photo up to date.
              </p>
            </div>

            <ProfilePanel user={currentUser} onUserChange={setCurrentUser} />
          </section>
        </div>
      </div>
    </div>
  )
}
