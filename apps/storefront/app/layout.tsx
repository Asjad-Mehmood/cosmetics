import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { siteConfig } from "@/lib/config";
import { baseOpenGraph } from "@/lib/seo";
import { brandFont } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name}: Beauty & Pharmacy Store in Pakistan`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  keywords: [
    "online pharmacy Pakistan",
    "skincare Pakistan",
    "makeup online Pakistan",
    "beauty store Pakistan",
    "vitamins Pakistan",
    "cash on delivery",
  ],
  openGraph: {
    ...baseOpenGraph,
    title: `${siteConfig.name}: Beauty & Pharmacy Store in Pakistan`,
    description: siteConfig.description,
    url: siteConfig.url,
  },
  twitter: { card: "summary_large_image" },
  // Phone numbers in product text shouldn't turn into links on iOS.
  formatDetection: { telephone: false },
  // Search Console / Bing ownership tags, set in the hosting environment.
  verification: {
    ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
      ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
      : {}),
    ...(process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION
      ? { other: { "msvalidate.01": process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION } }
      : {}),
  },
};

export const viewport: Viewport = { themeColor: "#0f1d38" };

/**
 * One site, two areas: the shop (app/(shop), with its header and footer) and
 * the admin panel (app/admin). The API is served under /api/v1 (app/api).
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-PK" className={brandFont.variable} suppressHydrationWarning>
      <body>
        {children}
        {/* Cookie-free page-view analytics and Core Web Vitals (only active on Vercel). */}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
