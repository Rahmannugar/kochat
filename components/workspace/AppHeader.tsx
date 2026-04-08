"use client"

import Image from "next/image"
import { SignOutButton } from "@/components/shared/SignOutButton"
import { ThemeToggler } from "@/components/shared/ThemeToggler"
import { siteConfig } from "@/lib/utils/siteConfig"

export const AppHeader = () => {
  return (
    <header className="flex flex-col gap-4 rounded-[1.75rem] border border-border/70 bg-background/90 px-5 py-4 shadow-sm backdrop-blur md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-3">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10">
          <Image
            src={siteConfig.logo}
            alt="Kochat logo"
            width={30}
            height={30}
            className="size-24 object-contain"
          />
        </div>
        <div>
          <p className="text-xl font-semibold">{siteConfig.name}</p>
          <p className="text-sm text-muted-foreground">Private chat, groups, and AI in one place.</p>
        </div>
      </div>

      <div className="flex items-center gap-3 self-end md:self-auto">
        <ThemeToggler />
        <SignOutButton />
      </div>
    </header>
  )
}
