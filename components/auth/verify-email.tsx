"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { ShieldCheckIcon } from "@phosphor-icons/react";
import { useForm } from "react-hook-form";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  verifyEmailSchema,
  type VerifyEmailValues,
} from "@/lib/auth/auth.schema";
import { useEmailOtp } from "@/lib/auth/useEmailOtp";

type VerifyEmailFormProps = {
  email: string;
};

export const VerifyEmailForm = ({ email }: VerifyEmailFormProps) => {
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
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setCooldownSeconds((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearTimeout(timeoutId);
  }, [cooldownSeconds]);

  const handleSubmit = form.handleSubmit(async ({ otp }) => {
    setNotice("");

    await verifyEmail({
      email,
      otp,
    });

    router.replace("/dashboard")
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
    setNotice("A new verification code has been sent.");
  };

  return (
    <AuthLayout
      eyebrow="Verify email"
      title="Verify your email"
      description={`Enter the 6-digit code sent to ${email}.`}
      asideTitle="Confirm your email before entering Kochat."
      asideDescription="Email verification protects account access and ensures chats, uploads, and realtime activity are tied to a verified identity."
      asideItems={[
        {
          title: "Verified access",
          description:
            "Messaging, uploads, and room activity stay behind a confirmed account.",
        },
        {
          title: "One final step",
          description:
            "Once your email is verified, Kochat will route you to the right next step automatically.",
        },
        {
          title: "Secure delivery",
          description:
            "If the email is delayed, you can request a fresh code without leaving the flow.",
        },
      ]}
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-1">
          <Label htmlFor="otp">OTP</Label>
          <Input
            id="otp"
            inputMode="numeric"
            maxLength={6}
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

        {error ? (
          <p className="text-xs leading-tight text-destructive">
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
    </AuthLayout>
  );
};
