"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  GearSixIcon,
  HashIcon,
  LockSimpleIcon,
  PlusIcon,
  UserCirclePlusIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react";
import { CursorPagination } from "@/components/shared/CursorPagination";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRooms } from "@/lib/rooms/useRooms";
import type { AuthUser } from "@/lib/auth/auth.types";
import { cn } from "@/lib/utils";

type RoomListPanelProps = {
  user: AuthUser;
  selectedRoomId?: string | null;
  showQuickActions?: boolean;
  hideRoomsList?: boolean;
  activeDashboardTab?: "rooms" | "start-chat" | "create-group" | "join-group";
  onDashboardTabChange?: (
    nextTab: "rooms" | "start-chat" | "create-group" | "join-group",
  ) => void;
};

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

export const RoomListPanel = ({
  user,
  selectedRoomId = null,
  showQuickActions = false,
  hideRoomsList = false,
  activeDashboardTab = "rooms",
  onDashboardTabChange,
}: RoomListPanelProps) => {
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useRooms();
  const pages = data?.pages ?? [];
  const [pageIndex, setPageIndex] = useState(0);
  const memberships = pages[pageIndex]?.items ?? [];
  const canGoBack = pageIndex > 0;
  const canGoNext = pageIndex < pages.length - 1 || Boolean(hasNextPage);

  useEffect(() => {
    if (pageIndex > 0 && pageIndex >= pages.length) {
      setPageIndex(Math.max(0, pages.length - 1));
    }
  }, [pageIndex, pages.length]);

  const handleNextPage = async () => {
    if (pageIndex < pages.length - 1) {
      setPageIndex((current) => current + 1);
      return;
    }

    if (!hasNextPage || isFetchingNextPage) {
      return;
    }

    const result = await fetchNextPage();

    if (result.data?.pages.length && pageIndex < result.data.pages.length - 1) {
      setPageIndex((current) => current + 1);
    }
  };

  return (
    <Card className="min-w-0 overflow-hidden rounded-[1.75rem] border-border/70 bg-background/90 backdrop-blur">
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

        {showQuickActions ? (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onDashboardTabChange?.("rooms")}
              className={cn(
                "inline-flex h-11 items-center justify-start gap-2 rounded-2xl border px-4 text-sm font-medium transition-colors",
                activeDashboardTab === "rooms"
                  ? "border-primary/40 bg-primary/10 text-foreground"
                  : "border-border bg-background hover:bg-muted/40",
              )}
            >
              <HashIcon size={18} weight="bold" />
              <span>Conversations</span>
            </button>
            <button
              type="button"
              onClick={() => onDashboardTabChange?.("start-chat")}
              className={cn(
                "inline-flex h-11 items-center justify-start gap-2 rounded-2xl border px-4 text-sm font-medium transition-colors",
                activeDashboardTab === "start-chat"
                  ? "border-primary/40 bg-primary/10 text-foreground"
                  : "border-border bg-background hover:bg-muted/40",
              )}
            >
              <UserCirclePlusIcon size={18} weight="bold" />
              <span>New chat</span>
            </button>
            <button
              type="button"
              onClick={() => onDashboardTabChange?.("create-group")}
              className={cn(
                "inline-flex h-11 items-center justify-start gap-2 rounded-2xl border px-4 text-sm font-medium transition-colors",
                activeDashboardTab === "create-group"
                  ? "border-primary/40 bg-primary/10 text-foreground"
                  : "border-border bg-background hover:bg-muted/40",
              )}
            >
              <UsersThreeIcon size={18} weight="bold" />
              <span>New group</span>
            </button>
            <button
              type="button"
              onClick={() => onDashboardTabChange?.("join-group")}
              className={cn(
                "inline-flex h-11 items-center justify-start gap-2 rounded-2xl border px-4 text-sm font-medium transition-colors",
                activeDashboardTab === "join-group"
                  ? "border-primary/40 bg-primary/10 text-foreground"
                  : "border-border bg-background hover:bg-muted/40",
              )}
            >
              <PlusIcon size={18} weight="bold" />
              <span>Join group</span>
            </button>
            <Link
              href="/profile"
              className="inline-flex h-11 items-center justify-start gap-2 rounded-2xl border border-border bg-background px-4 text-sm font-medium transition-colors hover:bg-muted/40"
            >
              <GearSixIcon size={18} weight="bold" />
              <span>Profile</span>
            </Link>
          </div>
        ) : null}
      </CardHeader>

      {hideRoomsList ? null : (
        <CardContent className="space-y-4 pt-0">
          <div className="flex min-w-0 items-center justify-between gap-3">
            <p className="truncate text-sm font-medium">Your conversations</p>
            <span className="shrink-0 text-xs text-muted-foreground">
              {isLoading ? "Loading..." : `${memberships.length} shown`}
            </span>
          </div>

          <ScrollArea className="h-[520px] w-full">
            <div className="min-w-0 space-y-2 pr-3">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="h-20 rounded-[1.5rem] border border-border/50 bg-muted/40"
                />
              ))
            ) : memberships.length > 0 ? (
              memberships.map((membership) => {
                const room = membership.room;
                const isSelected = room.id === selectedRoomId;

                return (
                  <Link
                    key={room.id}
                    href={`/rooms/${room.id}`}
                    className={cn(
                      "block w-full min-w-0 overflow-hidden rounded-[1.5rem] border px-4 py-3 text-left transition-colors",
                      isSelected
                        ? "border-primary/40 bg-primary/10"
                        : "border-border/60 bg-background hover:bg-muted/40",
                    )}
                  >
                    <div className="flex min-w-0 items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          {room.type === "group" ? (
                            <HashIcon
                              size={16}
                              weight="bold"
                              className="text-primary"
                            />
                          ) : (
                            <LockSimpleIcon
                              size={16}
                              weight="bold"
                              className="text-primary"
                            />
                          )}
                          <p className="truncate font-medium">{room.name}</p>
                        </div>
                        <p className="mt-1 line-clamp-2 break-words text-sm text-muted-foreground">
                          {room.description ||
                            (room.type === "group"
                              ? "Private group room joined by secure code."
                              : "Direct conversation between two members.")}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-muted px-2 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                        {room.type}
                      </span>
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="rounded-[1.5rem] border border-dashed border-border/70 bg-muted/30 p-5 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">No rooms yet</p>
                <p className="mt-2">
                  Start with a direct message or create your first group room.
                  This workspace will update in realtime as conversations begin.
                </p>
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
          </ScrollArea>
        </CardContent>
      )}
    </Card>
  );
};
