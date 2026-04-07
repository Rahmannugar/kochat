"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import {
  ChatsCircleIcon,
  HashIcon,
  LockSimpleIcon,
  SparkleIcon,
  UserCirclePlusIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react"
import { SignOutButton } from "@/components/shared/SignOutButton"
import { ThemeToggler } from "@/components/shared/ThemeToggler"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useRooms } from "@/lib/rooms/useRooms"
import type { AuthUser } from "@/lib/auth/auth.types"
import { cn } from "@/lib/utils"
import { siteConfig } from "@/lib/utils/siteConfig"

type WorkspaceShellProps = {
  user: AuthUser
}

const getRoomInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")

export const WorkspaceShell = ({ user }: WorkspaceShellProps) => {
  const { data: memberships = [], isLoading } = useRooms()
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)

  useEffect(() => {
    if (selectedRoomId || memberships.length === 0) {
      return
    }

    setSelectedRoomId(memberships[0]?.room.id ?? null)
  }, [memberships, selectedRoomId])

  const selectedMembership = useMemo(
    () => memberships.find((membership) => membership.room.id === selectedRoomId) ?? null,
    [memberships, selectedRoomId],
  )

  const selectedRoom = selectedMembership?.room ?? null

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(160,214,255,0.7),transparent_26%),linear-gradient(180deg,var(--background)_0%,color-mix(in_oklab,var(--background)_92%,white)_100%)] px-4 py-6 dark:bg-[radial-gradient(circle_at_top,rgba(43,84,132,0.35),transparent_18%),linear-gradient(180deg,oklch(0.19_0.02_255)_0%,var(--background)_100%)]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
        <header className="flex flex-col gap-4 rounded-[1.75rem] border border-border/70 bg-background/90 px-5 py-4 shadow-sm backdrop-blur md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10">
              <Image
                src={siteConfig.logo}
                alt="Kochat logo"
                width={30}
                height={30}
                className="size-7 object-contain"
              />
            </div>
            <div>
              <p className="text-xl font-semibold">{siteConfig.name}</p>
              <p className="text-sm text-muted-foreground">
                Rooms, DMs, realtime updates, and AI support from one workspace.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end md:self-auto">
            <ThemeToggler />
            <SignOutButton />
          </div>
        </header>

        <div className="grid gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
          <Card className="rounded-[1.75rem] border-border/70 bg-background/90 backdrop-blur">
            <CardHeader className="gap-4">
              <div className="flex items-center gap-3">
                <Avatar className="size-11 border border-border/60">
                  <AvatarImage src={user.image ?? undefined} alt={user.name} />
                  <AvatarFallback>{getRoomInitials(user.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <CardTitle className="truncate text-base">{user.name}</CardTitle>
                  <CardDescription className="truncate">
                    {user.username ? `@${user.username}` : user.email}
                  </CardDescription>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="justify-start rounded-full">
                  <UserCirclePlusIcon size={18} weight="bold" />
                  New chat
                </Button>
                <Button className="justify-start rounded-full">
                  <UsersThreeIcon size={18} weight="bold" />
                  New group
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Your conversations</p>
                <span className="text-xs text-muted-foreground">
                  {isLoading ? "Loading..." : `${memberships.length} total`}
                </span>
              </div>

              <ScrollArea className="h-[520px] pr-3">
                <div className="space-y-2">
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, index) => (
                      <div
                        key={index}
                        className="h-20 rounded-[1.5rem] border border-border/50 bg-muted/40"
                      />
                    ))
                  ) : memberships.length > 0 ? (
                    memberships.map((membership) => {
                      const room = membership.room
                      const isSelected = room.id === selectedRoomId

                      return (
                        <button
                          key={room.id}
                          type="button"
                          onClick={() => setSelectedRoomId(room.id)}
                          className={cn(
                            "w-full rounded-[1.5rem] border px-4 py-3 text-left transition-colors",
                            isSelected
                              ? "border-primary/40 bg-primary/10"
                              : "border-border/60 bg-background hover:bg-muted/40",
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                {room.type === "group" ? (
                                  <HashIcon size={16} weight="bold" className="text-primary" />
                                ) : (
                                  <LockSimpleIcon
                                    size={16}
                                    weight="bold"
                                    className="text-primary"
                                  />
                                )}
                                <p className="truncate font-medium">{room.name}</p>
                              </div>
                              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                                {room.description ||
                                  (room.type === "group"
                                    ? "Private group room joined by secure code."
                                    : "Direct conversation between two members.")}
                              </p>
                            </div>
                            <span className="rounded-full bg-muted px-2 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                              {room.type}
                            </span>
                          </div>
                        </button>
                      )
                    })
                  ) : (
                    <div className="rounded-[1.5rem] border border-dashed border-border/70 bg-muted/30 p-5 text-sm text-muted-foreground">
                      <p className="font-medium text-foreground">No rooms yet</p>
                      <p className="mt-2">
                        Start with a direct message or create your first group room. This
                        workspace will update in realtime as conversations begin.
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="rounded-[1.75rem] border-border/70 bg-background/90 backdrop-blur">
            <CardHeader className="gap-4 border-b border-border/60">
              {selectedRoom ? (
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      {selectedRoom.type === "group" ? (
                        <UsersThreeIcon size={22} weight="bold" className="text-primary" />
                      ) : (
                        <ChatsCircleIcon size={22} weight="bold" className="text-primary" />
                      )}
                      {selectedRoom.name}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {selectedRoom.type === "group"
                        ? `Join code: ${selectedRoom.code}`
                        : "Private direct conversation room"}
                    </CardDescription>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <SparkleIcon size={16} weight="fill" className="text-primary" />
                    AI and live messages plug into this room next
                  </div>
                </div>
              ) : (
                <>
                  <CardTitle>Select a conversation</CardTitle>
                  <CardDescription>
                    Pick a room from the left to load its timeline and realtime activity.
                  </CardDescription>
                </>
              )}
            </CardHeader>

            <CardContent className="flex min-h-[580px] flex-col justify-between gap-6 p-6">
              {selectedRoom ? (
                <>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-[1.5rem] border border-border/60 bg-muted/30 p-4">
                      <p className="text-sm font-medium text-foreground">Room type</p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {selectedRoom.type === "group"
                          ? "Group collaboration space"
                          : "Secure one-to-one direct room"}
                      </p>
                    </div>
                    <div className="rounded-[1.5rem] border border-border/60 bg-muted/30 p-4">
                      <p className="text-sm font-medium text-foreground">Realtime status</p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Message SSE, typing, and presence are ready to plug into this shell.
                      </p>
                    </div>
                    <div className="rounded-[1.5rem] border border-border/60 bg-muted/30 p-4">
                      <p className="text-sm font-medium text-foreground">Media + AI</p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Images, voice messages, AI prompts, and audio playback already have backend
                        support.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-1 items-center justify-center rounded-[1.75rem] border border-dashed border-border/70 bg-muted/20 p-8 text-center">
                    <div className="max-w-md space-y-3">
                      <p className="text-lg font-semibold">Chat surface is the next UI slice</p>
                      <p className="text-sm text-muted-foreground">
                        This workspace shell is now wired to the real room list. Next we connect the
                        message timeline, composer, typing indicators, and AI streaming UI into
                        the selected room.
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-1 items-center justify-center rounded-[1.75rem] border border-dashed border-border/70 bg-muted/20 p-8 text-center">
                  <div className="max-w-md space-y-3">
                    <p className="text-lg font-semibold">No conversation selected</p>
                    <p className="text-sm text-muted-foreground">
                      Choose a room from the left. Once selected, we’ll swap this placeholder for
                      the actual live message timeline and composer.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
