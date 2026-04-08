"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  ChatsCircleIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react"
import { toast } from "sonner"
import { AppHeader } from "@/components/workspace/AppHeader"
import { RoomListPanel } from "@/components/workspace/RoomListPanel"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { AuthUser } from "@/lib/auth/auth.types"
import { apiClient, ApiError } from "@/lib/utils/client"

type ApiResponse<T> = {
  data: T
}

type RoomResponse = {
  id: string
}

type SearchUserResponse = {
  id: string
  name: string
  username: string | null
  email: string
}

type DashboardHubProps = {
  user: AuthUser
}

const getApiErrorMessage = (fallback: string, error: unknown) => {
  if (error instanceof ApiError) {
    const data = error.data

    if (
      data &&
      typeof data === "object" &&
      "error" in data &&
      data.error &&
      typeof data.error === "object" &&
      "message" in data.error &&
      typeof data.error.message === "string"
    ) {
      return data.error.message
    }

    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return fallback
}

export const DashboardHub = ({ user }: DashboardHubProps) => {
  const router = useRouter()
  const [lookupQuery, setLookupQuery] = useState("")
  const [groupName, setGroupName] = useState("")
  const [groupDescription, setGroupDescription] = useState("")
  const [joinCode, setJoinCode] = useState("")
  const [isSubmittingDirect, setIsSubmittingDirect] = useState(false)
  const [isSubmittingGroup, setIsSubmittingGroup] = useState(false)
  const [isJoiningGroup, setIsJoiningGroup] = useState(false)

  const handleStartDirectChat = async () => {
    const query = lookupQuery.trim()

    if (!query || isSubmittingDirect) {
      return
    }

    setIsSubmittingDirect(true)

    try {
      const searchResponse = await apiClient.get<ApiResponse<SearchUserResponse>>(
        `/users/search?query=${encodeURIComponent(query)}`,
      )
      const roomResponse = await apiClient.post<ApiResponse<RoomResponse>>("/rooms/direct", {
        targetUserId: searchResponse.data.id,
      })

      toast.success("Direct chat ready.")
      router.push(`/rooms/${roomResponse.data.id}`)
    } catch (error) {
      toast.error(getApiErrorMessage("Unable to start direct chat.", error))
    } finally {
      setIsSubmittingDirect(false)
    }
  }

  const handleCreateGroup = async () => {
    if (!groupName.trim() || isSubmittingGroup) {
      return
    }

    setIsSubmittingGroup(true)

    try {
      const response = await apiClient.post<ApiResponse<RoomResponse>>("/rooms/group", {
        name: groupName,
        description: groupDescription.trim() || undefined,
      })

      toast.success("Group created.")
      router.push(`/rooms/${response.data.id}`)
    } catch (error) {
      toast.error(getApiErrorMessage("Unable to create group.", error))
    } finally {
      setIsSubmittingGroup(false)
    }
  }

  const handleJoinGroup = async () => {
    if (!joinCode.trim() || isJoiningGroup) {
      return
    }

    setIsJoiningGroup(true)

    try {
      const response = await apiClient.post<ApiResponse<RoomResponse>>("/rooms/join", {
        code: joinCode,
      })

      toast.success("Joined group.")
      router.push(`/rooms/${response.data.id}`)
    } catch (error) {
      toast.error(getApiErrorMessage("Unable to join group.", error))
    } finally {
      setIsJoiningGroup(false)
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(160,214,255,0.7),transparent_26%),linear-gradient(180deg,var(--background)_0%,color-mix(in_oklab,var(--background)_92%,white)_100%)] px-4 py-6 dark:bg-[radial-gradient(circle_at_top,rgba(43,84,132,0.35),transparent_18%),linear-gradient(180deg,oklch(0.19_0.02_255)_0%,var(--background)_100%)]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
        <AppHeader />

        <div className="grid gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
          <RoomListPanel user={user} />

          <div className="grid gap-4 lg:grid-cols-2">
            <Card id="start-chat" className="rounded-[1.75rem] border-border/70 bg-background/90 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MagnifyingGlassIcon size={20} weight="bold" className="text-primary" />
                  Start direct chat
                </CardTitle>
                <CardDescription>
                  Search by exact username or email, then open a private room immediately.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="dashboard-direct-query">Username or email</Label>
                  <Input
                    id="dashboard-direct-query"
                    value={lookupQuery}
                    onChange={(event) => setLookupQuery(event.target.value)}
                    placeholder="jane or jane@example.com"
                    className="h-12 rounded-2xl border-black/8 bg-white/78 px-4 dark:border-white/10 dark:bg-white/5"
                  />
                </div>

                <Button
                  type="button"
                  className="h-12 rounded-2xl"
                  disabled={!lookupQuery.trim() || isSubmittingDirect}
                  onClick={() => void handleStartDirectChat()}
                >
                  <ChatsCircleIcon size={18} weight="bold" />
                  {isSubmittingDirect ? "Starting..." : "Open direct chat"}
                </Button>
              </CardContent>
            </Card>

            <Card id="create-group" className="rounded-[1.75rem] border-border/70 bg-background/90 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <UsersThreeIcon size={20} weight="bold" className="text-primary" />
                  Create group
                </CardTitle>
                <CardDescription>
                  Spin up a group room with a generated join code for the people you invite.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="dashboard-group-name">Group name</Label>
                  <Input
                    id="dashboard-group-name"
                    value={groupName}
                    onChange={(event) => setGroupName(event.target.value)}
                    placeholder="Product launch"
                    className="h-12 rounded-2xl border-black/8 bg-white/78 px-4 dark:border-white/10 dark:bg-white/5"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dashboard-group-description">Description</Label>
                  <Textarea
                    id="dashboard-group-description"
                    value={groupDescription}
                    onChange={(event) => setGroupDescription(event.target.value)}
                    placeholder="What this group room is for."
                    className="min-h-28 rounded-[1.25rem] border-black/8 bg-white/78 px-4 py-3 dark:border-white/10 dark:bg-white/5"
                  />
                </div>

                <Button
                  type="button"
                  className="h-12 rounded-2xl"
                  disabled={!groupName.trim() || isSubmittingGroup}
                  onClick={() => void handleCreateGroup()}
                >
                  <PlusIcon size={18} weight="bold" />
                  {isSubmittingGroup ? "Creating..." : "Create group"}
                </Button>
              </CardContent>
            </Card>

            <Card id="join-group" className="rounded-[1.75rem] border-border/70 bg-background/90 backdrop-blur lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <UsersThreeIcon size={20} weight="bold" className="text-primary" />
                  Join group
                </CardTitle>
                <CardDescription>
                  Enter an exact group code to join the room without typeahead or discovery noise.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4 md:flex-row md:items-end">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="dashboard-join-code">Group code</Label>
                  <Input
                    id="dashboard-join-code"
                    value={joinCode}
                    onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
                    placeholder="GR-AB12CD34"
                    className="h-12 rounded-2xl border-black/8 bg-white/78 px-4 dark:border-white/10 dark:bg-white/5"
                  />
                </div>

                <Button
                  type="button"
                  className="h-12 rounded-2xl md:px-6"
                  disabled={!joinCode.trim() || isJoiningGroup}
                  onClick={() => void handleJoinGroup()}
                >
                  {isJoiningGroup ? "Joining..." : "Join group"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
