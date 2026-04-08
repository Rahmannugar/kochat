"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { ThemeToggler } from "@/components/shared/ThemeToggler";
import { siteConfig } from "@/lib/utils/siteConfig";

type AuthLayoutProps = {
  eyebrow: string;
  title: string;
  description: string;
  asideTitle: string;
  asideDescription: string;
  asideItems: Array<{
    title: string;
    description: string;
  }>;
  children: ReactNode;
};

export const AuthLayout = ({
  eyebrow,
  title,
  description,
  asideTitle,
  asideDescription,
  asideItems,
  children,
}: AuthLayoutProps) => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(160deg,#f8fbff_0%,#eef4ff_42%,#f7f1e8_100%)] px-4 py-10 dark:bg-[linear-gradient(180deg,#09111d_0%,#0f1728_56%,#111826_100%)]">
      <div className="absolute inset-x-0 top-0 h-[320px] bg-[radial-gradient(circle_at_top,rgba(109,182,255,0.26),transparent_60%)] dark:bg-[radial-gradient(circle_at_top,rgba(79,133,206,0.2),transparent_60%)]" />
      <div className="absolute -left-16 top-20 h-56 w-56 rounded-full bg-[rgba(255,200,120,0.14)] blur-3xl dark:bg-[rgba(255,193,94,0.08)]" />
      <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-[rgba(100,164,255,0.14)] blur-3xl dark:bg-[rgba(85,123,196,0.12)]" />

      <div className="absolute right-4 top-4 z-30">
        <ThemeToggler />
      </div>

      <div className="pointer-events-none absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-[linear-gradient(180deg,transparent_0%,rgba(15,23,42,0.12)_12%,rgba(15,23,42,0.12)_88%,transparent_100%)] lg:block dark:bg-[linear-gradient(180deg,transparent_0%,rgba(255,255,255,0.1)_12%,rgba(255,255,255,0.1)_88%,transparent_100%)]" />

      <div className="relative z-10 mx-auto grid min-h-[calc(100vh-5rem)] w-full max-w-6xl items-center gap-8 pt-14 lg:grid-cols-[minmax(0,1.05fr)_1px_minmax(0,0.95fr)] lg:gap-10 lg:pt-0">
        <section className="hidden min-h-[620px] gap-8 py-10 pr-10 lg:flex lg:flex-col">
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="flex size-14 items-center justify-center rounded-full border border-white/70 bg-white/80 shadow-sm dark:border-white/10 dark:bg-white/8">
                <Image
                  src={siteConfig.logo}
                  alt="Kochat logo"
                  width={34}
                  height={34}
                  className="size-24 object-contain"
                />
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.22em] text-muted-foreground">
                  {eyebrow}
                </p>
                <h1 className="text-3xl font-semibold tracking-tight">
                  {siteConfig.name}
                </h1>
              </div>
            </div>

            <div className="space-y-4">
              <p className="max-w-xl text-4xl font-semibold leading-[1.06] tracking-[-0.035em] text-balance">
                {asideTitle}
              </p>
              <p className="max-w-lg text-[15px] leading-7 text-muted-foreground">
                {asideDescription}
              </p>
            </div>
          </div>

          <div className="grid max-w-3xl auto-rows-fr gap-3 sm:grid-cols-3">
            {asideItems.map((item) => (
              <div
                key={item.title}
                className="flex h-full flex-col rounded-[1.35rem] border border-black/6 bg-white/72 p-4 backdrop-blur dark:border-white/10 dark:bg-white/6"
              >
                <p className="text-sm font-medium">{item.title}</p>
                <p className="mt-2 text-[13px] leading-6 text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <div className="hidden w-px lg:block" />

        <section className="mx-auto w-full max-w-[480px] lg:max-w-none">
          <div className="space-y-8 rounded-[2rem] border border-white/65 bg-white/76 p-6 shadow-[0_24px_90px_rgba(57,77,118,0.12)] backdrop-blur dark:border-white/10 dark:bg-[rgba(10,16,28,0.78)] dark:shadow-[0_24px_90px_rgba(0,0,0,0.28)] sm:p-8">
            <div className="flex items-center gap-3 lg:hidden">
              <div className="flex size-12 items-center justify-center rounded-full border border-white/70 bg-white/85 shadow-sm dark:border-white/10 dark:bg-white/8">
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
              <h2 className="text-3xl font-semibold tracking-[-0.03em]">
                {title}
              </h2>
              <p className="max-w-md text-sm leading-6 text-muted-foreground">
                {description}
              </p>
            </div>

            {children}
          </div>
        </section>
      </div>
    </div>
  );
};
