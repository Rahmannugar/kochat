"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  ArrowCounterClockwiseIcon,
  EyeClosedIcon,
  EyeIcon,
  PasswordIcon,
} from "@phosphor-icons/react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import {
  forgotPasswordSchema,
  type ForgotPasswordValues,
} from "@/lib/auth/auth.schema"
import { useEmailOtp } from "@/lib/auth/useEmailOtp"
import { AuthLayout } from "@/components/auth/AuthLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export const ForgotPasswordForm = () => {
  const router = useRouter()
  const { requestPasswordReset, resetPassword, isPending, error } = useEmailOtp()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [hasRequestedCode, setHasRequestedCode] = useState(false)
  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
      otp: "",
      password: "",
      confirmPassword: "",
    },
  })

  const email = form.watch("email")

  const handleRequestCode = async () => {
    const isEmailValid = await form.trigger("email")

    if (!isEmailValid) {
      return
    }

    await requestPasswordReset(email)
    setHasRequestedCode(true)
    toast.success("If that email can reset a password, a code has been sent.")
  }

  const handleSubmit = form.handleSubmit(async (values) => {
    await resetPassword({
      email: values.email,
      otp: values.otp,
      password: values.password,
    })

    toast.success("Password updated. You can sign in now.")
    router.replace("/sign-in")
  })

  return (
    <AuthLayout
      eyebrow="Forgot password"
      title="Reset your password"
      description="Use the reset code sent to your email to choose a new password for your Kochat account."
      asideTitle="Recover access without starting over."
      asideDescription="This reset flow is only for email and password accounts. Google and GitHub users should continue signing in with their provider."
      asideItems={[
        {
          title: "Email-password only",
          description:
            "Use this only if you normally sign in with your email and password.",
        },
        {
          title: "Short-lived reset codes",
          description:
            "The reset code is one-time and expires quickly for safety.",
        },
        {
          title: "Back into Kochat fast",
          description:
            "Reset the password, return to sign in, and continue where you left off.",
        },
      ]}
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-1">
          <Label htmlFor="forgot-email">Email</Label>
          <div className="flex gap-2">
            <Input
              id="forgot-email"
              type="email"
              placeholder="Email address"
              className="h-12 rounded-2xl border-black/8 bg-white/78 px-4 dark:border-white/10 dark:bg-white/5"
              {...form.register("email")}
            />
            <Button
              type="button"
              variant="outline"
              className="h-12 shrink-0 rounded-2xl px-4"
              onClick={() => void handleRequestCode()}
              disabled={isPending}
            >
              <ArrowCounterClockwiseIcon size={18} weight="bold" />
              {hasRequestedCode ? "Resend" : "Send code"}
            </Button>
          </div>
          {form.formState.errors.email ? (
            <p className="text-[13px] leading-4 text-destructive">
              {form.formState.errors.email.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-1">
          <Label htmlFor="forgot-otp">OTP</Label>
          <Input
            id="forgot-otp"
            inputMode="numeric"
            placeholder="Enter OTP"
            className="h-12 rounded-2xl border-black/8 bg-white/78 px-4 dark:border-white/10 dark:bg-white/5"
            {...form.register("otp")}
          />
          {form.formState.errors.otp ? (
            <p className="text-[13px] leading-4 text-destructive">
              {form.formState.errors.otp.message}
            </p>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="forgot-password">New password</Label>
            <div className="relative">
              <Input
                id="forgot-password"
                type={showPassword ? "text" : "password"}
                placeholder="New password"
                className="h-12 rounded-2xl border-black/8 bg-white/78 px-4 pr-12 dark:border-white/10 dark:bg-white/5"
                {...form.register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeClosedIcon size={18} /> : <EyeIcon size={18} />}
              </button>
            </div>
            {form.formState.errors.password ? (
              <p className="text-[13px] leading-4 text-destructive">
                {form.formState.errors.password.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-1">
            <Label htmlFor="forgot-confirm-password">Confirm password</Label>
            <div className="relative">
              <Input
                id="forgot-confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm password"
                className="h-12 rounded-2xl border-black/8 bg-white/78 px-4 pr-12 dark:border-white/10 dark:bg-white/5"
                {...form.register("confirmPassword")}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((current) => !current)}
                className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <EyeClosedIcon size={18} /> : <EyeIcon size={18} />}
              </button>
            </div>
            {form.formState.errors.confirmPassword ? (
              <p className="text-[13px] leading-4 text-destructive">
                {form.formState.errors.confirmPassword.message}
              </p>
            ) : null}
          </div>
        </div>

        {error ? (
          <p className="text-xs leading-tight text-destructive">{error}</p>
        ) : null}

        <Button
          type="submit"
          className="h-12 w-full rounded-2xl"
          disabled={isPending}
        >
          <PasswordIcon size={18} weight="bold" />
          {isPending ? "Updating..." : "Reset password"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Remembered it?{" "}
        <Link
          href="/sign-in"
          className="font-medium text-foreground underline underline-offset-4"
        >
          Back to sign in
        </Link>
      </p>
    </AuthLayout>
  )
}
