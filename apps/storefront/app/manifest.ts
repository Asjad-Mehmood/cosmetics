import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/config";

/** Web app manifest: name, colours and icons for "Add to home screen". */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.name,
    short_name: siteConfig.name,
    description: siteConfig.description,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0f1d38",
    lang: "en-PK",
    categories: ["shopping", "health", "beauty"],
    icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
