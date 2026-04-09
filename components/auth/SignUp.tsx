"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  EyeClosedIcon,
  EyeIcon,
  UserPlusIcon,
} from "@phosphor-icons/react";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "@/lib/auth/useAuth";
import { useEmailOtp } from "@/lib/auth/useEmailOtp";
import { signUpSchema, type SignUpValues } from "@/lib/auth/auth.schema";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { GitHubIcon } from "@/components/shared/GitHubIcon";
import { GoogleIcon } from "@/components/shared/GoogleIcon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
export const SignUpForm = () => {
  const router = useRouter();
  const { signUpWithEmail, signInWithGitHub, signInWithGoogle } = useAuth();
  const { sendOtp } = useEmailOtp();
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isGooglePending, startGoogleTransition] = useTransition();
  const [isGitHubPending, startGitHubTransition] = useTransition();
  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    setErrorMessage("");

    const result = await signUpWithEmail(values);

    if (result.error) {
      setErrorMessage(
        result.error.message ?? "Unable to create your account right now",
      );
      return;
    }

    try {
      await sendOtp({
        email: values.email,
        type: "email-verification",
      });
    } catch {}

    router.replace(`/verify-email?email=${encodeURIComponent(values.email)}`);
  });

  const handleGoogleSignIn = () => {
    setErrorMessage("");

    startGoogleTransition(async () => {
      const result = await signInWithGoogle();

      if (result?.error) {
        setErrorMessage(
          result.error.message ?? "Unable to continue with Google",
        );
      }
    });
  };

  const handleGitHubSignIn = () => {
    setErrorMessage("");

    startGitHubTransition(async () => {
      const result = await signInWithGitHub();

      if (result?.error) {
        setErrorMessage(
          result.error.message ?? "Unable to continue with GitHub",
        );
      }
    });
  };

  return (
    <AuthLayout
      eyebrow="Create account"
      title="Create your account"
      description="Set your identity once, verify your email, and move straight into direct messages, secure groups, and AI-assisted threads."
      asideTitle="Claim your identity once and start talking right away."
      asideDescription="Kochat gives teams one place for private direct chat, secure group rooms, voice notes, and in-thread AI without turning every screen into noise."
      asideItems={[
        {
          title: "Direct chat",
          description:
            "Start private conversations by exact username or email instead of browsing everyone.",
        },
        {
          title: "Secure group rooms",
          description:
            "Create invite-only rooms with generated codes and keep access intentional.",
        },
        {
          title: "AI in-thread",
          description:
            "Ask for help inside the conversation when it adds value instead of switching context.",
        },
      ]}
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="name">Full name</Label>
            <Input
              id="name"
              placeholder="Your full name"
              className="h-12 rounded-2xl border-black/8 bg-white/78 px-4 dark:border-white/10 dark:bg-white/5"
              {...form.register("name")}
            />
            {form.formState.errors.name ? (
              <p className="text-[13px] leading-4 text-destructive">
                {form.formState.errors.name.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Email address"
              className="h-12 rounded-2xl border-black/8 bg-white/78 px-4 dark:border-white/10 dark:bg-white/5"
              {...form.register("email")}
            />
            {form.formState.errors.email ? (
              <p className="text-[13px] leading-4 text-destructive">
                {form.formState.errors.email.message}
              </p>
            ) : null}
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              placeholder="Choose a username"
              className="h-12 rounded-2xl border-black/8 bg-white/78 px-4 dark:border-white/10 dark:bg-white/5"
              {...form.register("username")}
            />
            {form.formState.errors.username ? (
              <p className="text-[13px] leading-4 text-destructive">
                {form.formState.errors.username.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-1">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Create a password"
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
        </div>

        <div className="space-y-1">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Repeat your password"
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

        {errorMessage ? (
          <p className="text-xs leading-tight text-destructive">
            {errorMessage}
          </p>
        ) : null}

        <Button
          type="submit"
          className="h-12 w-full rounded-2xl"
          disabled={form.formState.isSubmitting}
        >
          <UserPlusIcon size={18} weight="bold" />
          {form.formState.isSubmitting
            ? "Creating account..."
            : "Create account"}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border/70" />
        </div>
        <div className="relative flex justify-center text-[11px] uppercase tracking-[0.26em] text-muted-foreground">
          <span className="bg-background px-3">Or continue with</span>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Button
          type="button"
          variant="outline"
          className="h-12 w-full rounded-2xl border-black/10 bg-white/78 dark:border-white/10 dark:bg-white/5"
          onClick={handleGoogleSignIn}
          disabled={isGooglePending || isGitHubPending}
        >
          <GoogleIcon className="size-[18px]" />
          {isGooglePending ? "Redirecting..." : "Google"}
        </Button>

        <Button
          type="button"
          variant="outline"
          className="h-12 w-full rounded-2xl border-black/10 bg-white/78 dark:border-white/10 dark:bg-white/5"
          onClick={handleGitHubSignIn}
          disabled={isGooglePending || isGitHubPending}
        >
          <GitHubIcon className="size-[18px]" />
          {isGitHubPending ? "Redirecting..." : "GitHub"}
        </Button>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/sign-in"
          className="font-medium text-foreground underline underline-offset-4"
        >
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
};
