import Link from "next/link"
import { ArrowLeftIcon, MagnifyingGlassIcon } from "@phosphor-icons/react"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const NotFoundPage = () => {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(160,214,255,0.7),transparent_26%),linear-gradient(180deg,var(--background)_0%,color-mix(in_oklab,var(--background)_92%,white)_100%)] px-4 py-6 dark:bg-[radial-gradient(circle_at_top,rgba(43,84,132,0.35),transparent_18%),linear-gradient(180deg,oklch(0.19_0.02_255)_0%,var(--background)_100%)]">
      <div className="mx-auto flex min-h-[80vh] w-full max-w-3xl items-center justify-center">
        <section className="w-full rounded-[2rem] border border-border/70 bg-background/90 p-8 text-center shadow-sm backdrop-blur md:p-10">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <MagnifyingGlassIcon size={28} weight="bold" />
          </div>

          <h1 className="mt-6 text-3xl font-semibold tracking-tight">Page not found</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground md:text-base">
            The page you were trying to open does not exist anymore, or you do not have access to it.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/dashboard"
              className={cn(buttonVariants({ className: "rounded-full px-6" }))}
            >
              <ArrowLeftIcon size={18} weight="bold" />
              Back to dashboard
            </Link>
            <Link
              href="/profile"
              className={cn(buttonVariants({ variant: "outline", className: "rounded-full px-6" }))}
            >
              Go to profile
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}

export default NotFoundPage
