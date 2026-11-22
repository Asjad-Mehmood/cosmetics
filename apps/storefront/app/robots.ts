import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      // Product photos are served by the API (/api/v1/media/...): search engines
      // need them for image results and product rich results.
      allow: ["/", "/api/v1/media/"],
      disallow: [
        "/account",
        "/cart",
        "/checkout",
        "/search",
        "/login",
        "/register",
        "/reset-password",
        "/verify-email",
        "/orders",
        "/track-order",
        "/unsubscribe",
        "/admin",
        "/api/",
      ],
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
