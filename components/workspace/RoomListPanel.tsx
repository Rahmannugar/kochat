"use client"

import Link from "next/link"
import {
  GearSixIcon,
  HashIcon,
  LockSimpleIcon,
  PlusIcon,
  UserCirclePlusIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useRooms } from "@/lib/rooms/useRooms"
import type { AuthUser } from "@/lib/auth/auth.types"
import { cn } from "@/lib/utils"

type RoomListPanelProps = {
  user: AuthUser
  selectedRoomId?: string | null
}

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")

export const RoomListPanel = ({
  user,
  selectedRoomId = null,
}: RoomListPanelProps) => {
  const { data: memberships = [], isLoading } = useRooms()

  return (
    <Card className="rounded-[1.75rem] border-border/70 bg-background/90 backdrop-blur">
      <CardHeader className="gap-4 pb-4">
        <div className="flex items-center gap-3">
          <Avatar className="size-11 border border-border/60">
            <AvatarImage src={user.image ?? undefined} alt={user.name} />
            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <CardTitle className="truncate text-base">{user.name}</CardTitle>
            <CardDescription className="truncate">
              {user.username ? `@${user.username}` : user.email}
            </CardDescription>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          <Button asChild variant="outline" className="h-10 justify-start rounded-2xl px-4">
            <Link href="/dashboard#start-chat">
              <UserCirclePlusIcon size={18} weight="bold" />
              New chat
            </Link>
          </Button>
          <Button asChild className="h-10 justify-start rounded-2xl px-4">
            <Link href="/dashboard#create-group">
              <UsersThreeIcon size={18} weight="bold" />
              New group
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-10 justify-start rounded-2xl px-4">
            <Link href="/dashboard#join-group">
              <PlusIcon size={18} weight="bold" />
              Join group
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-10 justify-start rounded-2xl px-4">
            <Link href="/profile">
              <GearSixIcon size={18} weight="bold" />
              Profile
            </Link>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-0">
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
                  <Link
                    key={room.id}
                    href={`/rooms/${room.id}`}
                    className={cn(
                      "block w-full rounded-[1.5rem] border px-4 py-3 text-left transition-colors",
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
                            <LockSimpleIcon size={16} weight="bold" className="text-primary" />
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
                  </Link>
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
  )
}
