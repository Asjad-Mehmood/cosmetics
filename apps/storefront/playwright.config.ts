import { defineConfig, devices } from "@playwright/test";

const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

/**
 * End-to-end tests against the real site: the shop, the admin panel (/admin)
 * and the API (/api/v1). Build it first (`pnpm build`). Locally an
 * already-running site is reused; in CI it is started here.
 */
const E2E_SECRET = process.env.JWT_ACCESS_SECRET ?? "e2e-only-secret-at-least-32-characters-long";

export default defineConfig({
  testDir: "./e2e",
  // Card tests need demo card payments, which the store has off by default.
  globalSetup: "./e2e/card-payments.ts",
  globalTeardown: "./e2e/card-payments-teardown.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: [/mobile\.spec/, /admin\//],
    },
    { name: "mobile", use: { ...devices["Pixel 7"] }, testMatch: /mobile\.spec/ },
    {
      name: "admin",
      use: { ...devices["Desktop Chrome"] },
      testMatch: /admin\/.*\.spec/,
    },
  ],
  // The two Vercel services, run locally: the API (apps/api) on port 4000 and
  // the storefront, which proxies /api/* to it like the project's rewrites do.
  webServer: [
    {
      command: "pnpm --filter @store/api start",
      url: "http://localhost:4000/api/v1/health",
      reuseExistingServer: !process.env.CI,
      // Production mode needs a non-default secret; demo card payments are
      // allowed explicitly; and the tests sign in more often than the login
      // rate limit allows.
      env: {
        NODE_ENV: "production",
        PORT: "4000",
        JWT_ACCESS_SECRET: E2E_SECRET,
        ALLOW_DEMO_PAYMENTS: "true",
        RATE_LIMIT_ENABLED: "false",
      },
      timeout: 90_000,
    },
    {
      command: "pnpm --filter @store/storefront start",
      // Through the storefront's /api proxy, so the wiring is checked too.
      url: `${BASE_URL}/api/v1/health`,
      reuseExistingServer: !process.env.CI,
      // Same secret as the API, for the server-side internal-request token.
      env: { JWT_ACCESS_SECRET: E2E_SECRET, API_URL: "http://localhost:4000" },
      timeout: 90_000,
    },
  ],
});
