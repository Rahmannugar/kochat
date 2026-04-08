"use client";

import Image from "next/image";
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
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(160deg,#f7fbff_0%,#eef4ff_38%,#f7f3ec_100%)] px-4 py-10 dark:bg-[linear-gradient(180deg,#09111d_0%,#0f1728_56%,#111826_100%)]">
      <div className="absolute inset-x-0 top-0 h-[320px] bg-[radial-gradient(circle_at_top,rgba(109,182,255,0.28),transparent_60%)] dark:bg-[radial-gradient(circle_at_top,rgba(79,133,206,0.24),transparent_60%)]" />
      <div className="absolute -left-16 top-24 h-56 w-56 rounded-full bg-[rgba(255,200,120,0.18)] blur-3xl dark:bg-[rgba(255,193,94,0.08)]" />
      <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-[rgba(100,164,255,0.16)] blur-3xl dark:bg-[rgba(85,123,196,0.14)]" />

      <div className="absolute right-4 top-4 z-30">
        <ThemeToggler />
      </div>

      <div className="relative z-10 mx-auto grid min-h-[calc(100vh-5rem)] w-full max-w-6xl items-center gap-6 pt-14 lg:grid-cols-[1.05fr_0.95fr] lg:pt-0">
        <section className="hidden rounded-[2.2rem] border border-white/55 bg-white/60 p-8 shadow-[0_25px_80px_rgba(66,91,131,0.12)] backdrop-blur lg:block dark:border-white/10 dark:bg-white/5 dark:shadow-[0_25px_80px_rgba(0,0,0,0.28)]">
          <div className="max-w-xl space-y-10">
            <div className="flex items-center gap-4">
              <div className="flex size-14 items-center justify-center rounded-[1.4rem] bg-white shadow-sm ring-1 ring-black/5 dark:bg-white/10 dark:ring-white/10">
                <Image
                  src={siteConfig.logo}
                  alt="Kochat logo"
                  width={34}
                  height={34}
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
                Keep conversations human. Bring AI in only when it helps.
              </p>
              <p className="max-w-lg text-base leading-7 text-muted-foreground">
                Kochat gives teams one place for direct messages, private group rooms, voice notes,
                and in-thread AI help without making the whole product feel like a bot.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[1.6rem] border border-black/5 bg-white/70 p-4 dark:border-white/10 dark:bg-white/6">
                <p className="text-sm font-medium">Group rooms</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Create secure group rooms with shareable codes.
                </p>
              </div>
              <div className="rounded-[1.6rem] border border-black/5 bg-white/70 p-4 dark:border-white/10 dark:bg-white/6">
                <p className="text-sm font-medium">Direct chat</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Search by username or email and jump straight in.
                </p>
              </div>
              <div className="rounded-[1.6rem] border border-black/5 bg-white/70 p-4 dark:border-white/10 dark:bg-white/6">
                <p className="text-sm font-medium">AI assist</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Summon help in-thread without leaving the conversation.
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
                Welcome back
              </CardTitle>
              <CardDescription className="max-w-sm text-sm leading-6">
                Sign in to continue into your conversations, rooms, and live
                AI-assisted threads.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-5 px-7 pb-7">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
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
                    placeholder="Password"
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
