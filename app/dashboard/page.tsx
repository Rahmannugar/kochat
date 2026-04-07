import Image from "next/image"
import { redirect } from "next/navigation"
import { SignOutButton } from "@/components/auth/sign-out-button"
import { ThemeToggler } from "@/components/shared/ThemeToggler"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getServerSession } from "@/lib/auth/auth"
import { AuthGuard } from "@/components/auth/auth-guard"
import { authService } from "@/lib/services/auth.service"
import { siteConfig } from "@/lib/utils/siteConfig"

const DashboardPage = async () => {
  const session = await getServerSession()

  if (!session) {
    redirect("/sign-in")
  }

  const bootstrap = await authService.bootstrapUserAccount({
    id: session.user.id,
    name: session.user.name,
    image: session.user.image,
  })

  return (
    <AuthGuard initialUser={session.user}>
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(160,214,255,0.7),_transparent_26%),linear-gradient(180deg,_var(--background)_0%,_color-mix(in_oklab,var(--background)_92%,white)_100%)] px-4 py-6 dark:bg-[radial-gradient(circle_at_top,_rgba(43,84,132,0.35),_transparent_18%),linear-gradient(180deg,_oklch(0.19_0.02_255)_0%,_var(--background)_100%)]">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
          <header className="flex items-center justify-between rounded-[1.75rem] border border-border/70 bg-background/90 px-5 py-4 shadow-sm backdrop-blur">
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
                <p className="text-xl font-semibold">Dashboard</p>
                <p className="text-sm text-muted-foreground">
                  You are signed in as {session.user.email}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggler />
              <SignOutButton />
            </div>
          </header>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <Card className="rounded-[1.75rem] border-border/70 bg-background/90 backdrop-blur">
              <CardHeader>
                <CardTitle>Auth foundation is live</CardTitle>
                <CardDescription>
                  We now have BetterAuth, Drizzle, repositories, services, proxy redirects, and a
                  clean place to continue into chat.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>User ensured for: {bootstrap.user.name}</p>
                <p>Username currently set to: {bootstrap.user.username ?? "not set yet"}</p>
                <p>Profile bootstrap complete for user: {bootstrap.user.id}</p>
                <p>Next backend slice is room and message APIs.</p>
              </CardContent>
            </Card>

            <Card className="rounded-[1.75rem] border-border/70 bg-background/90 backdrop-blur">
              <CardHeader>
                <CardTitle>Next up</CardTitle>
                <CardDescription>Realtime workspace shell and conversation loading.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>Fetch conversation list through repositories and services.</p>
                <p>Replace this placeholder with the real workspace dashboard shell.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}

export default DashboardPage
