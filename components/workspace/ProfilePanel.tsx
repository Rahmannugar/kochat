"use client"

import { useEffect, useRef, useState } from "react"
import {
  CameraPlusIcon,
  CircleNotchIcon,
  PencilSimpleIcon,
} from "@phosphor-icons/react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { AuthUser } from "@/lib/auth/auth.types"
import { usePushNotifications } from "@/lib/push/usePushNotifications"
import {
  AVATAR_ALLOWED_MIME_TYPES,
  AVATAR_MAX_SIZE_BYTES,
} from "@/lib/storage/storage.constants"
import { apiClient, ApiError } from "@/lib/utils/client"
import { toast } from "sonner"

type ApiResponse<T> = {
  data: T
}

type ProfilePanelProps = {
  user: AuthUser
  onUserChange: (user: AuthUser) => void
}

const getInitials = (value: string) =>
  value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")

export const ProfilePanel = ({ user, onUserChange }: ProfilePanelProps) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [formValues, setFormValues] = useState({
    name: user.name,
    username: user.username ?? "",
    bio: user.bio ?? "",
  })
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const {
    isSupported: isPushSupported,
    isConfigured: isPushConfigured,
    permission: pushPermission,
    isSubscribed: isPushSubscribed,
    isPending: isPushPending,
    error: pushError,
    enableNotifications,
    disableNotifications,
  } = usePushNotifications()

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl)
      }
    }
  }, [avatarPreviewUrl])

  const handleFieldChange = (
    field: "name" | "username" | "bio",
    value: string,
  ) => {
    setFormValues((current) => ({
      ...current,
      [field]: value,
    }))
    setErrorMessage("")
  }

  const handleSaveProfile = async () => {
    setIsSaving(true)
    setErrorMessage("")

    try {
      const response = await apiClient.patch<ApiResponse<AuthUser>>("/users/profile", {
        name: formValues.name,
        username: formValues.username,
        bio: formValues.bio.trim() ? formValues.bio : null,
      })

      onUserChange(response.data)
      setFormValues({
        name: response.data.name,
        username: response.data.username ?? "",
        bio: response.data.bio ?? "",
      })
      toast.success("Profile updated.")
    } catch (profileError) {
      if (profileError instanceof ApiError) {
        const data = profileError.data

        if (
          data &&
          typeof data === "object" &&
          "error" in data &&
          data.error &&
          typeof data.error === "object" &&
          "message" in data.error &&
          typeof data.error.message === "string"
        ) {
          setErrorMessage(data.error.message)
        } else {
          setErrorMessage(profileError.message)
        }
      } else {
        setErrorMessage("Unable to update your profile right now.")
      }

      toast.error("Unable to update your profile right now.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleAvatarSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    if (!AVATAR_ALLOWED_MIME_TYPES.includes(file.type)) {
      setErrorMessage("Select a JPG, PNG, or WebP image.")
      toast.error("Select a JPG, PNG, or WebP image.")
      event.target.value = ""
      return
    }

    if (file.size > AVATAR_MAX_SIZE_BYTES) {
      setErrorMessage("Profile images must be 10MB or smaller.")
      toast.error("Profile images must be 10MB or smaller.")
      event.target.value = ""
      return
    }

    const nextPreviewUrl = URL.createObjectURL(file)
    if (avatarPreviewUrl) {
      URL.revokeObjectURL(avatarPreviewUrl)
    }
    setAvatarPreviewUrl(nextPreviewUrl)
    setIsUploadingAvatar(true)
    setErrorMessage("")

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await apiClient.post<
        ApiResponse<{
          upload: {
            path: string
            publicUrl: string
          }
          user: AuthUser
        }>
      >("/uploads/avatar", formData)

      onUserChange(response.data.user)
      setAvatarPreviewUrl(null)
      toast.success("Profile image updated.")
    } catch (avatarError) {
      if (avatarError instanceof ApiError) {
        const data = avatarError.data

        if (
          data &&
          typeof data === "object" &&
          "error" in data &&
          data.error &&
          typeof data.error === "object" &&
          "message" in data.error &&
          typeof data.error.message === "string"
        ) {
          setErrorMessage(data.error.message)
        } else {
          setErrorMessage(avatarError.message)
        }
      } else {
        setErrorMessage("Unable to upload your profile image right now.")
      }

      toast.error("Unable to upload your profile image right now.")
    } finally {
      setIsUploadingAvatar(false)
      event.target.value = ""
    }
  }

  return (
    <div className="flex min-h-[580px] flex-col gap-5">
      <div className="rounded-[1.75rem] border border-border/60 bg-muted/20 p-5 md:p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Avatar size="lg" className="size-20">
              <AvatarImage src={avatarPreviewUrl ?? user.image ?? undefined} alt={user.name} />
              <AvatarFallback className="text-base">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>

            <div>
              <p className="text-xl font-semibold">{user.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {user.username ? `@${user.username}` : user.email}
              </p>
              <p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
                {user.bio || "Add a short bio to give your profile a little more context."}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
              className="hidden"
              onChange={handleAvatarSelect}
            />
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              disabled={isUploadingAvatar}
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploadingAvatar ? <CircleNotchIcon className="animate-spin" size={16} /> : <CameraPlusIcon size={16} weight="bold" />}
              {isUploadingAvatar ? "Uploading..." : avatarPreviewUrl ? "Upload photo" : "Change photo"}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_320px]">
        <div className="rounded-[1.75rem] border border-border/60 bg-background/75 p-5 md:p-6">
          <div className="mb-5">
            <p className="text-lg font-semibold">Edit profile</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Update how your identity appears across direct chats and secure group rooms.
            </p>
          </div>

          <div className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="profile-name">Full name</Label>
                <Input
                  id="profile-name"
                  value={formValues.name}
                  onChange={(event) => handleFieldChange("name", event.target.value)}
                  className="h-12 rounded-2xl border-black/8 bg-white/78 px-4 dark:border-white/10 dark:bg-white/5"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile-username">Username</Label>
                <Input
                  id="profile-username"
                  value={formValues.username}
                  onChange={(event) => handleFieldChange("username", event.target.value)}
                  className="h-12 rounded-2xl border-black/8 bg-white/78 px-4 dark:border-white/10 dark:bg-white/5"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-bio">Bio</Label>
              <Textarea
                id="profile-bio"
                value={formValues.bio}
                onChange={(event) => handleFieldChange("bio", event.target.value)}
                placeholder="Tell people what you’re here for."
                className="min-h-28 rounded-[1.25rem] border-black/8 bg-white/78 px-4 py-3 dark:border-white/10 dark:bg-white/5"
              />
              <p className="text-xs text-muted-foreground">
                Keep it short and clear. This appears on your profile in Kochat.
              </p>
            </div>

            {errorMessage ? (
              <p className="text-sm text-destructive">{errorMessage}</p>
            ) : null}

            <Button
              type="button"
              className="h-12 rounded-2xl"
              disabled={isSaving}
              onClick={() => void handleSaveProfile()}
            >
              {isSaving ? <CircleNotchIcon className="animate-spin" size={18} /> : <PencilSimpleIcon size={18} weight="bold" />}
              {isSaving ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-[1.75rem] border border-border/60 bg-background/75 p-5">
            <p className="text-sm font-medium text-foreground">Account email</p>
            <p className="mt-2 break-all text-sm text-muted-foreground">
              {user.email}
            </p>
          </div>

          <div className="rounded-[1.75rem] border border-border/60 bg-background/75 p-5">
            <p className="text-sm font-medium text-foreground">Push notifications</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Get notified about new messages when you are away from the room.
            </p>
            <p className="mt-3 text-xs text-muted-foreground">
              {!isPushSupported
                ? "This browser does not support web push notifications."
                : !isPushConfigured
                  ? "Push notifications are not configured yet."
                  : isPushSubscribed
                    ? "Notifications are currently enabled on this device."
                    : pushPermission === "denied"
                      ? "Notification permission is blocked in this browser."
                      : "Notifications are currently off on this device."}
            </p>

            {pushError ? (
              <p className="mt-3 text-sm text-destructive">{pushError}</p>
            ) : null}

            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                type="button"
                variant={isPushSubscribed ? "outline" : "default"}
                className="rounded-full"
                disabled={!isPushSupported || !isPushConfigured || isPushPending || pushPermission === "denied"}
                onClick={() =>
                  void (isPushSubscribed ? disableNotifications() : enableNotifications())
                }
              >
                {isPushPending
                  ? "Saving..."
                  : isPushSubscribed
                    ? "Disable notifications"
                    : "Enable notifications"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
