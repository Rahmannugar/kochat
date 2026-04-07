"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowRightIcon, GoogleLogoIcon, UserPlusIcon } from "@phosphor-icons/react"
import { useForm } from "react-hook-form"
import { useAuth } from "@/hooks/useAuth"
import { signUpSchema, type SignUpValues } from "@/lib/auth/auth.schema"
import { siteConfig } from "@/lib/utils/siteConfig"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ThemeToggler } from "@/components/shared/ThemeToggler"

export const SignUpForm = () => {
  const router = useRouter()
  const { signUpWithEmail, signInWithGoogle } = useAuth()
  const [errorMessage, setErrorMessage] = React.useState("")
  const [isGooglePending, startGoogleTransition] = React.useTransition()
  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  })

  const handleSubmit = form.handleSubmit(async (values) => {
    setErrorMessage("")

    const result = await signUpWithEmail(values)

    if (result.error) {
      setErrorMessage(result.error.message ?? "Unable to create your account right now")
      return
    }

    router.replace("/dashboard")
  })

  const handleGoogleSignIn = () => {
    setErrorMessage("")

    startGoogleTransition(async () => {
      const result = await signInWithGoogle()

      if (result?.error) {
        setErrorMessage(result.error.message ?? "Unable to continue with Google")
      }
    })
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(160,214,255,0.75),transparent_28%),linear-gradient(180deg,var(--background)_0%,color-mix(in_oklab,var(--background)_92%,white)_100%)] dark:bg-[radial-gradient(circle_at_top,rgba(43,84,132,0.35),transparent_20%),linear-gradient(180deg,oklch(0.19_0.02_255)_0%,var(--background)_100%)]" />
      <div className="absolute right-4 top-4">
        <ThemeToggler />
      </div>

      <Card className="relative z-10 w-full max-w-md rounded-[2rem] border-border/70 bg-background/90 shadow-xl backdrop-blur">
        <CardHeader className="space-y-5">
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
              <CardTitle className="text-2xl">Create your account</CardTitle>
              <CardDescription>Get added to General and jump straight into the workspace.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" placeholder="Ada Lovelace" {...form.register("name")} />
              {form.formState.errors.name ? (
                <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@company.com" {...form.register("email")} />
              {form.formState.errors.email ? (
                <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="Create a strong password" {...form.register("password")} />
              {form.formState.errors.password ? (
                <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
              ) : null}
            </div>

            {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}

            <Button type="submit" className="w-full rounded-full" disabled={form.formState.isSubmitting}>
              <UserPlusIcon size={18} weight="bold" />
              {form.formState.isSubmitting ? "Creating account..." : "Create account"}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/70" />
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-[0.24em] text-muted-foreground">
              <span className="bg-background px-3">Or continue with</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full rounded-full"
            onClick={handleGoogleSignIn}
            disabled={isGooglePending}
          >
            <GoogleLogoIcon size={18} weight="fill" />
            {isGooglePending ? "Redirecting..." : "Google"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/sign-in" className="font-medium text-foreground underline underline-offset-4">
              Sign in
            </Link>
          </p>

          <div className="rounded-[1.5rem] bg-muted/50 p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">What happens after sign up?</p>
            <p className="mt-1">
              We bootstrap your profile, ensure the default General room exists, and make sure
              you are a member before you land in the dashboard.
            </p>
            <div className="mt-3 flex items-center gap-2 text-foreground">
              <ArrowRightIcon size={16} weight="bold" />
              <span>Account created {"->"} General room membership ensured {"->"} Dashboard</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
