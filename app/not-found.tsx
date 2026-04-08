import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const NotFoundPage = () => {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(160,214,255,0.7),transparent_26%),linear-gradient(180deg,var(--background)_0%,color-mix(in_oklab,var(--background)_92%,white)_100%)] px-4 py-6 dark:bg-[radial-gradient(circle_at_top,rgba(43,84,132,0.35),transparent_18%),linear-gradient(180deg,oklch(0.19_0.02_255)_0%,var(--background)_100%)]">
      <div className="mx-auto flex min-h-[80vh] w-full max-w-4xl items-center justify-center">
        <section className="w-full overflow-hidden rounded-[2rem] border border-border/70 bg-background/90 shadow-sm backdrop-blur">
          <div className="grid lg:grid-cols-[1.05fr_minmax(0,1fr)]">
            <div className="relative border-b border-border/60 bg-[linear-gradient(180deg,rgba(14,165,233,0.08),transparent),radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_48%)] p-8 lg:border-b-0 lg:border-r lg:p-10">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-foreground/85">
                Kochat
              </p>
              <div className="mt-8">
                <p className="text-[clamp(5.5rem,22vw,9rem)] leading-[0.88] font-semibold tracking-[-0.08em] text-foreground/88">
                  404
                </p>
              </div>
              <p className="mt-6 max-w-sm text-sm leading-7 text-muted-foreground md:text-base">
                The page you tried to open is not available from this path.
              </p>
            </div>

            <div className="p-8 md:p-10">
              <h1 className="text-3xl font-semibold tracking-tight">
                Page not found
              </h1>
              <p className="mt-3 max-w-lg text-sm leading-7 text-muted-foreground md:text-base">
                Return to a page that still belongs to your workspace.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/dashboard"
                  className={cn(buttonVariants({ size: "lg", className: "rounded-full px-7" }))}
                >
                  Back to dashboard
                </Link>
                <Link
                  href="/profile"
                  className={cn(
                    buttonVariants({
                      variant: "outline",
                      size: "lg",
                      className: "rounded-full px-7",
                    }),
                  )}
                >
                  Go to profile
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

export default NotFoundPage
