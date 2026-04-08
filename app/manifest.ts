import type { MetadataRoute } from "next"
import { siteConfig } from "@/lib/utils/siteConfig"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.name,
    short_name: siteConfig.name,
    description: siteConfig.description,
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#f8fbff",
    theme_color: "#3a6cf6",
    orientation: "portrait",
    icons: [
      {
        src: "/images/kochat-logo.png",
        sizes: "500x500",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/images/kochat-logo.png",
        sizes: "500x500",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  }
}
