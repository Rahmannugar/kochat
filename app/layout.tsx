import type { Metadata } from "next"
import { AppProvider } from "@/lib/providers/AppProvider"
import { aeonik } from "@/lib/utils/fonts"
import { siteConfig } from "@/lib/utils/siteConfig"
import "./globals.css"

export const metadata: Metadata = {
  title: siteConfig.name,
  description: siteConfig.description,
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
      className={`${aeonik.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  )
}
