import type { Metadata } from "next"
import { AppProvider } from "@/lib/providers/AppProvider"
import { getServerEnv } from "@/lib/env/server"
import { aeonik } from "@/lib/utils/fonts"
import { siteConfig } from "@/lib/utils/siteConfig"
import "./globals.css"

const metadataBase =
  process.env.BETTER_AUTH_URL || getServerEnv().BETTER_AUTH_URL || "http://localhost:3000"

export const metadata: Metadata = {
  title: siteConfig.name,
  description: siteConfig.description,
  metadataBase: new URL(metadataBase),
  openGraph: {
    title: siteConfig.name,
    description: siteConfig.description,
    images: [siteConfig.openGraphImage],
    siteName: siteConfig.openGraph.siteName,
    locale: siteConfig.openGraph.locale,
    type: siteConfig.openGraph.type,
  },
  twitter: {
    card: siteConfig.twitter.card,
    title: siteConfig.twitter.title,
    description: siteConfig.twitter.description,
    images: [siteConfig.openGraphImage],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${aeonik.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  )
}
