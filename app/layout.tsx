import type { Metadata } from "next"
import { AppProvider } from "@/lib/providers/AppProvider"
import { aeonik } from "@/lib/utils/fonts"
import { siteConfig } from "@/lib/utils/siteConfig"
import "./globals.css"

export const metadata: Metadata = {
  title: siteConfig.name,
  description: siteConfig.description,
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
