"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { EnvelopeSimpleIcon, ShieldCheckIcon } from "@phosphor-icons/react";
import { useForm } from "react-hook-form";
import { ThemeToggler } from "@/components/shared/ThemeToggler";
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
import {
  verifyEmailSchema,
  type VerifyEmailValues,
} from "@/lib/auth/auth.schema";
import { useEmailOtp } from "@/lib/auth/useEmailOtp";
import { siteConfig } from "@/lib/utils/siteConfig";

type VerifyEmailFormProps = {
  email: string;
  initialName: string;
};

export const VerifyEmailForm = ({
  email,
  initialName,
}: VerifyEmailFormProps) => {
  const router = useRouter();
  const { sendOtp, verifyEmail, isPending, error } = useEmailOtp();
  const [notice, setNotice] = useState("");
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const form = useForm<VerifyEmailValues>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: {
      otp: "",
    },
  });

  useEffect(() => {
    if (cooldownSeconds <= 0) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setCooldownSeconds((current) => Math.max(0, current - 1))
    }, 1000)

    return () => window.clearTimeout(timeoutId)
  }, [cooldownSeconds])

  const handleSubmit = form.handleSubmit(async ({ otp }) => {
    setNotice("");

    await verifyEmail({
      email,
      otp,
    });

    router.replace("/");
  });

  const handleResend = async () => {
    if (cooldownSeconds > 0) {
      return;
    }

    setNotice("");

    await sendOtp({
      email,
      type: "email-verification",
    });

    setCooldownSeconds(30);
    setNotice("A fresh verification code has been sent to your email.");
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(160deg,#f7fbff_0%,#eff5ff_42%,#f8f4ec_100%)] px-4 py-10 dark:bg-[linear-gradient(180deg,#09111d_0%,#0f1728_56%,#111826_100%)]">
      <div className="absolute inset-x-0 top-0 h-[320px] bg-[radial-gradient(circle_at_top,rgba(109,182,255,0.24),transparent_60%)] dark:bg-[radial-gradient(circle_at_top,rgba(79,133,206,0.2),transparent_60%)]" />
      <div className="absolute -left-16 top-24 h-56 w-56 rounded-full bg-[rgba(255,200,120,0.14)] blur-3xl dark:bg-[rgba(255,193,94,0.07)]" />
      <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-[rgba(100,164,255,0.14)] blur-3xl dark:bg-[rgba(85,123,196,0.12)]" />

      <div className="absolute right-4 top-4 z-30">
        <ThemeToggler />
      </div>

      <div className="relative z-10 mx-auto grid min-h-[calc(100vh-5rem)] w-full max-w-6xl items-center gap-6 pt-14 lg:grid-cols-[1fr_0.95fr] lg:pt-0">
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
              <h1 className="text-3xl font-semibold tracking-tight">{siteConfig.name}</h1>
            </div>

            <div className="space-y-4">
              <p className="max-w-lg text-5xl font-semibold leading-[1.02] tracking-[-0.04em] text-balance">
                Confirm your email before stepping into Kochat.
              </p>
              <p className="max-w-lg text-base leading-7 text-muted-foreground">
                We use email verification to protect room access, uploads, and direct messaging.
                One quick code check and you’re through.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.6rem] border border-black/5 bg-white/70 p-4 dark:border-white/10 dark:bg-white/6">
                <p className="text-sm font-medium">Secure account access</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Verified email is required before chat, AI, uploads, and presence features open.
                </p>
              </div>
              <div className="rounded-[1.6rem] border border-black/5 bg-white/70 p-4 dark:border-white/10 dark:bg-white/6">
                <p className="text-sm font-medium">Fast next step</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  If your username is already set, you’ll go straight to your dashboard after this.
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
              <p className="text-xl font-semibold">{siteConfig.name}</p>
            </div>

            <div className="space-y-2">
              <CardTitle className="text-3xl tracking-[-0.03em]">
                Verify your email
              </CardTitle>
              <CardDescription className="max-w-sm text-sm leading-6">
                Enter the 6-digit code sent to <span className="font-medium text-foreground">{email}</span>.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-5 px-7 pb-7">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="rounded-[1.6rem] border border-black/6 bg-white/72 p-4 dark:border-white/10 dark:bg-white/5">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-full bg-primary/10 p-2 text-primary">
                    <EnvelopeSimpleIcon size={18} weight="fill" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Code destination</p>
                    <p className="text-sm text-muted-foreground">{email}</p>
                    {initialName ? (
                      <p className="text-xs text-muted-foreground">
                        Signed in as {initialName}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="otp">Verification code</Label>
                <Input
                  id="otp"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="123456"
                  className="h-12 rounded-2xl border-black/8 bg-white/75 px-4 text-center text-lg tracking-[0.35em] dark:border-white/10 dark:bg-white/5"
                  {...form.register("otp")}
                />
                {form.formState.errors.otp ? (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.otp.message}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Check spam if you don’t see the email right away.
                  </p>
                )}
              </div>

              {error ? (
                <p className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                  {error}
                </p>
              ) : null}

              {notice ? (
                <p className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
                  {notice}
                </p>
              ) : null}

              <Button
                type="submit"
                className="h-12 w-full rounded-2xl"
                disabled={isPending}
              >
                <ShieldCheckIcon size={18} weight="bold" />
                {isPending ? "Verifying..." : "Verify email"}
              </Button>
            </form>

            <Button
              type="button"
              variant="outline"
              className="h-12 w-full rounded-2xl border-black/10 bg-white/78 dark:border-white/10 dark:bg-white/5"
              onClick={handleResend}
              disabled={isPending || cooldownSeconds > 0}
            >
              {cooldownSeconds > 0
                ? `Resend in ${cooldownSeconds}s`
                : "Send a new code"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
