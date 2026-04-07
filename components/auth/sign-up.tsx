"use client";

import Image from "next/image";
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
import { signUpSchema, type SignUpValues } from "@/lib/auth/auth.schema";
import { siteConfig } from "@/lib/utils/siteConfig";
import { GoogleIcon } from "@/components/shared/GoogleIcon";
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

export const SignUpForm = () => {
  const router = useRouter();
  const { signUpWithEmail, signInWithGoogle } = useAuth();
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isGooglePending, startGoogleTransition] = useTransition();
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
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(160deg,#fbfbf6_0%,#f4f0ff_40%,#eef6ff_100%)] px-4 py-10 dark:bg-[linear-gradient(180deg,#0a1020_0%,#10182d_56%,#131723_100%)]">
      <div className="absolute inset-x-0 top-0 h-[340px] bg-[radial-gradient(circle_at_top,rgba(253,184,96,0.2),transparent_58%)] dark:bg-[radial-gradient(circle_at_top,rgba(223,154,73,0.14),transparent_58%)]" />
      <div className="absolute -right-10 top-24 h-64 w-64 rounded-full bg-[rgba(107,159,255,0.18)] blur-3xl dark:bg-[rgba(89,120,203,0.16)]" />
      <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-[rgba(255,179,112,0.16)] blur-3xl dark:bg-[rgba(255,173,82,0.08)]" />

      <div className="absolute right-4 top-4 z-30">
        <ThemeToggler />
      </div>

      <div className="relative z-10 mx-auto grid min-h-[calc(100vh-5rem)] w-full max-w-6xl items-center gap-6 pt-14 lg:grid-cols-[1fr_1fr] lg:pt-0">
        <section className="hidden rounded-[2.2rem] border border-white/55 bg-white/60 p-8 shadow-[0_25px_80px_rgba(66,91,131,0.12)] backdrop-blur lg:block dark:border-white/10 dark:bg-white/5 dark:shadow-[0_25px_80px_rgba(0,0,0,0.28)]">
          <div className="max-w-xl space-y-10">
            <div className="flex items-center gap-4">
              <div className="flex size-14 items-center justify-center rounded-[1.4rem] bg-white shadow-sm ring-1 ring-black/5 dark:bg-white/10 dark:ring-white/10">
                <Image
                  src={siteConfig.logo}
                  alt="Kochat logo"
                  width={48}
                  height={48}
                  className="size-8 object-contain"
                />
              </div>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight">
                  {siteConfig.name}
                </h1>
              </div>
            </div>

            <div className="space-y-4">
              <p className="max-w-lg text-5xl font-semibold leading-[1.02] tracking-[-0.04em] text-balance">
                Set up your identity once and start talking right away.
              </p>
              <p className="max-w-lg text-base leading-7 text-muted-foreground">
                Claim your username, keep your direct conversations private, and create secure
                rooms for the people you actually work with.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[1.6rem] border border-black/5 bg-white/70 p-4 dark:border-white/10 dark:bg-white/6">
                <p className="text-sm font-medium">Unique username</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Searchable for secure direct chats without noisy member lists.
                </p>
              </div>
              <div className="rounded-[1.6rem] border border-black/5 bg-white/70 p-4 dark:border-white/10 dark:bg-white/6">
                <p className="text-sm font-medium">Private rooms</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Groups stay invite-only through generated room codes.
                </p>
              </div>
              <div className="rounded-[1.6rem] border border-black/5 bg-white/70 p-4 dark:border-white/10 dark:bg-white/6">
                <p className="text-sm font-medium">AI on call</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Ask for help in the flow of work instead of switching context.
                </p>
              </div>
            </div>
          </div>
        </section>

        <Card className="w-full rounded-[2.2rem] border-white/60 bg-white/82 shadow-[0_24px_90px_rgba(57,77,118,0.14)] backdrop-blur dark:border-white/10 dark:bg-[rgba(10,16,28,0.86)] dark:shadow-[0_24px_90px_rgba(0,0,0,0.32)]">
          <CardHeader className="space-y-6 p-7">
            <div className="flex items-center gap-3 lg:hidden">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-black/5 dark:bg-white/10 dark:ring-white/10">
                <Image
                  src={siteConfig.logo}
                  alt="Kochat logo"
                  width={30}
                  height={30}
                  className="size-7 object-contain"
                />
              </div>
              <div>
                <p className="text-xl font-semibold">{siteConfig.name}</p>
              </div>
            </div>

            <div className="space-y-2">
              <CardTitle className="text-3xl tracking-[-0.03em]">
                Create your account
              </CardTitle>
              <CardDescription className="max-w-sm text-sm leading-6">
                Pick your identity once, then use it across direct messages,
                group rooms, and AI-assisted collaboration.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-5 px-7 pb-7">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full name</Label>
                  <Input
                    id="name"
                    placeholder="Your full name"
                    className="h-12 rounded-2xl border-black/8 bg-white/75 px-4 dark:border-white/10 dark:bg-white/5"
                    {...form.register("name")}
                  />
                  {form.formState.errors.name ? (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.name.message}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    placeholder="Choose a username"
                    className="h-12 rounded-2xl border-black/8 bg-white/75 px-4 dark:border-white/10 dark:bg-white/5"
                    {...form.register("username")}
                  />
                  {form.formState.errors.username ? (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.username.message}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      People can find you by this username or your email.
                    </p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Email address"
                    className="h-12 rounded-2xl border-black/8 bg-white/75 px-4 dark:border-white/10 dark:bg-white/5"
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
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a password"
                      className="h-12 rounded-2xl border-black/8 bg-white/75 px-4 pr-12 dark:border-white/10 dark:bg-white/5"
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
                    <p className="text-sm text-destructive">
                      {form.formState.errors.password.message}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      className="h-12 rounded-2xl border-black/8 bg-white/75 px-4 pr-12 dark:border-white/10 dark:bg-white/5"
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
                    <p className="text-sm text-destructive">
                      {form.formState.errors.confirmPassword.message}
                    </p>
                  ) : null}
                </div>
              </div>

              {errorMessage ? (
                <p className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
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
              Already have an account?{" "}
              <Link
                href="/sign-in"
                className="font-medium text-foreground underline underline-offset-4"
              >
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
