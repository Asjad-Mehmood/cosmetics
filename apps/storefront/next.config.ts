import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const here = dirname(fileURLToPath(import.meta.url));

// Locally the shared settings live in apps/api/.env (JWT_ACCESS_SECRET, used
// to sign the storefront's server-side API reads). Already-set variables win.
// On Vercel both services get the project's environment variables instead.
const apiEnv = join(here, "../api/.env");
if (existsSync(apiEnv)) process.loadEnvFile(apiEnv);

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const productionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;

/** The site's main host on production deploys (e.g. www.amazongroup.com.pk). */
const siteHost = (() => {
  if (process.env.VERCEL_ENV !== "production") return null;
  const url = process.env.NEXT_PUBLIC_SITE_URL ?? (productionUrl && `https://${productionUrl}`);
  return url && URL.canParse(url) ? new URL(url).host : null;
})();

/**
 * The `storefront` service: the shop (app/(shop)) and the admin panel
 * (app/admin). The API is the separate `api` service (apps/api): on Vercel the
 * project's top-level rewrites send /api/* to it, so it shares this domain
 * and its cookies are first-party.
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  env: {
    NEXT_PUBLIC_SITE_URL:
      process.env.NEXT_PUBLIC_SITE_URL ??
      (productionUrl ? `https://${productionUrl}` : "http://localhost:3000"),
  },
  // Workspace packages ship TypeScript source.
  transpilePackages: ["@store/ui", "@store/types", "@store/validation"],
  // Trace files from the whole monorepo (workspace packages live outside this app).
  outputFileTracingRoot: join(here, "../.."),
  // Local development without `vercel dev`: send /api/* to the API server
  // (pnpm dev runs it on port 4000), as Vercel's top-level rewrites do.
  async rewrites() {
    if (process.env.VERCEL) return [];
    const api = process.env.API_URL ?? "http://localhost:4000";
    return [{ source: "/api/:path*", destination: `${api.replace(/\/$/, "")}/api/:path*` }];
  },
  // Image hosts resize pictures themselves (see lib/image-loader.ts), so this
  // works on any host without an image-optimisation quota.
  images: { loader: "custom", loaderFile: "./lib/image-loader.ts" },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // The admin panel must never be indexed or framed.
      {
        source: "/admin/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
      { source: "/admin", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
      // The same site also answers on its *.vercel.app address. Only the main
      // domain should appear in search results, so other hosts aren't indexed.
      ...(siteHost
        ? [
            {
              source: "/:path*",
              missing: [{ type: "host" as const, value: siteHost }],
              headers: [{ key: "X-Robots-Tag", value: "noindex" }],
            },
          ]
        : []),
    ];
  },
};

export default nextConfig;
