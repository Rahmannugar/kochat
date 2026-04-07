"use client";

import { useRouter } from "next/navigation";
import { SignOutIcon } from "@phosphor-icons/react";
import { authClient } from "@/lib/auth/auth-client";
import { Button } from "@/components/ui/button";

export const SignOutButton = () => {
  const router = useRouter();

  const handleSignOut = async () => {
    await authClient.signOut();
    router.replace("/sign-in");
  };

  return (
    <Button
      type="button"
      variant="outline"
      className="rounded-full"
      onClick={handleSignOut}
    >
      <SignOutIcon size={18} weight="bold" />
      Sign out
    </Button>
  );
};
