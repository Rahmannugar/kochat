"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { GoogleLogoIcon, SignInIcon } from "@phosphor-icons/react";
import { useForm } from "react-hook-form";
import { useAuth } from "@/lib/auth/useAuth";
import { signInSchema, type SignInValues } from "@/lib/auth/auth.schema";
import { siteConfig } from "@/lib/utils/siteConfig";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggler } from "@/components/shared/ThemeToggler";

export const SignInForm = () => {
  const router = useRouter();
  const { signInWithEmail, signInWithGoogle } = useAuth();
  const [errorMessage, setErrorMessage] = React.useState("");
  const [isGooglePending, startGoogleTransition] = React.useTransition();
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

    router.replace("/dashboard");
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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(160,214,255,0.75),_transparent_28%),linear-gradient(180deg,_var(--background)_0%,_color-mix(in_oklab,var(--background)_92%,white)_100%)] dark:bg-[radial-gradient(circle_at_top,_rgba(43,84,132,0.35),_transparent_20%),linear-gradient(180deg,_oklch(0.19_0.02_255)_0%,_var(--background)_100%)]" />
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
              <CardTitle className="text-2xl">Welcome back</CardTitle>
              <CardDescription>
                Sign in to continue into your workspace.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                {...form.register("email")}
              />
              {form.formState.errors.email ? (
                <p className="text-sm text-destructive">
                  {form.formState.errors.email.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                {...form.register("password")}
              />
              {form.formState.errors.password ? (
                <p className="text-sm text-destructive">
                  {form.formState.errors.password.message}
                </p>
              ) : null}
            </div>

            {errorMessage ? (
              <p className="text-sm text-destructive">{errorMessage}</p>
            ) : null}

            <Button
              type="submit"
              className="w-full rounded-full"
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
            New here?{" "}
            <Link
              href="/sign-up"
              className="font-medium text-foreground underline underline-offset-4"
            >
              Create an account
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
