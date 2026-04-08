"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  EyeClosedIcon,
  EyeIcon,
  SignInIcon,
} from "@phosphor-icons/react";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "@/lib/auth/useAuth";
import { signInSchema, type SignInValues } from "@/lib/auth/auth.schema";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { GoogleIcon } from "@/components/shared/GoogleIcon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const SignInForm = () => {
  const router = useRouter();
  const { signInWithEmail, signInWithGoogle } = useAuth();
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isGooglePending, startGoogleTransition] = useTransition();
  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    setErrorMessage("");

    const result = await signInWithEmail(values);

    if (result.error) {
      setErrorMessage(result.error.message ?? "Unable to sign in right now");
      return;
    }

    router.replace("/");
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

  return (
    <AuthLayout
      eyebrow="Sign in"
      title="Welcome back"
      description="Sign in to continue into your direct messages, private rooms, and AI-assisted conversations."
      asideTitle="Pick up the conversation without re-learning the space."
      asideDescription="Kochat is built to feel familiar when you come back in: your chats stay private, your rooms stay organized, and your tools stay close to the thread."
      asideItems={[
        {
          title: "Continue where you left off",
          description:
            "Jump back into your recent chats and group rooms without hunting around.",
        },
        {
          title: "Private by default",
          description:
            "Direct chats and room access stay intentional instead of drifting into open discovery.",
        },
        {
          title: "Protected access",
          description:
            "Verified accounts keep rooms, uploads, and presence features behind a real identity check.",
        },
      ]}
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
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

        <div className="space-y-1">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
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
          <SignInIcon size={18} weight="bold" />
          {form.formState.isSubmitting ? "Signing in..." : "Sign in"}
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

      <Button
        type="button"
        variant="outline"
        className="h-12 w-full rounded-2xl border-black/10 bg-white/78 dark:border-white/10 dark:bg-white/5"
        onClick={handleGoogleSignIn}
        disabled={isGooglePending}
      >
        <GoogleIcon className="size-[18px]" />
        {isGooglePending ? "Redirecting..." : "Sign in with Google"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        New here?{" "}
        <Link
          href="/sign-up"
          className="font-medium text-foreground underline underline-offset-4"
        >
          Create an account
        </Link>
      </p>
    </AuthLayout>
  );
};
