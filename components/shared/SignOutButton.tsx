"use client"

import { SignOutIcon } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth/useAuth"

export const SignOutButton = () => {
  const { signOut } = useAuth()

  return (
    <Button
      type="button"
      variant="outline"
      className="rounded-full"
      onClick={() => void signOut()}
    >
      <SignOutIcon size={18} weight="bold" />
      Sign out
    </Button>
  )
}
