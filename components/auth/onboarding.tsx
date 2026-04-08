"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircleIcon } from "@phosphor-icons/react";
import { useState } from "react";
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
import { completeOnboardingSchema } from "@/lib/users/user.schema";
import { apiClient, ApiError } from "@/lib/utils/client";
import { siteConfig } from "@/lib/utils/siteConfig";

type OnboardingValues = {
  name: string;
  username: string;
};

type OnboardingFormProps = {
  initialName: string;
  initialEmail: string;
};

export const OnboardingForm = ({
  initialName,
  initialEmail,
}: OnboardingFormProps) => {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState("");
  const form = useForm<OnboardingValues>({
    resolver: zodResolver(completeOnboardingSchema),
    defaultValues: {
      name: initialName,
      username: "",
    },
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    setErrorMessage("");

    try {
      await apiClient.post("/users/onboarding", values);
      router.replace("/dashboard");
    } catch (error) {
      if (error instanceof ApiError) {
        const message =
          typeof error.data === "object" &&
          error.data &&
          "error" in error.data &&
          typeof (error.data as { error?: { message?: string } }).error?.message === "string"
            ? (error.data as { error: { message: string } }).error.message
            : error.message

        setErrorMessage(message);
        return;
      }

      setErrorMessage("Unable to complete your profile right now");
    }
  });

  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(160deg,#f6fbff_0%,#edf4ff_40%,#f7f3ec_100%)] px-4 py-10 dark:bg-[linear-gradient(180deg,#09111d_0%,#0f1728_56%,#111826_100%)]">
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
                Finish your identity and step into your conversations.
              </p>
              <p className="max-w-lg text-base leading-7 text-muted-foreground">
                Your username is how teammates find you for direct chats. Set it once and the rest
                of Kochat opens up.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.6rem] border border-black/5 bg-white/70 p-4 dark:border-white/10 dark:bg-white/6">
                <p className="text-sm font-medium">Findable identity</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Use a clean username so people can reach you directly without friction.
                </p>
              </div>
              <div className="rounded-[1.6rem] border border-black/5 bg-white/70 p-4 dark:border-white/10 dark:bg-white/6">
                <p className="text-sm font-medium">One quick step</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Once this is saved, you’ll enter Kochat and start using rooms, DMs, and AI.
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
              <CardTitle className="text-3xl tracking-[-0.03em]">Complete your profile</CardTitle>
              <CardDescription className="max-w-sm text-sm leading-6">
                Choose how your account appears in Kochat before you enter the app.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-5 px-7 pb-7">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={initialEmail}
                  disabled
                  className="h-12 rounded-2xl border-black/8 bg-white/65 px-4 dark:border-white/10 dark:bg-white/5"
                />
              </div>

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
                    Lowercase letters, numbers, and underscores only.
                  </p>
                )}
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
                <CheckCircleIcon size={18} weight="bold" />
                {form.formState.isSubmitting ? "Saving..." : "Complete setup"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
