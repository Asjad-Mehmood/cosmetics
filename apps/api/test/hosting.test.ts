import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import express from "express";
import supertest from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../src/app";
import { databaseUrl } from "../src/lib/prisma";
import vercelApp from "../src/vercel";
import {
  INTERNAL_HEADER,
  internalRequest,
  internalRequestToken,
} from "../src/middleware/internal-request";

const app = createApp();

describe("Vercel api service entry", () => {
  it("exports an Express app that serves the API at its public path", async () => {
    const res = await supertest(vercelApp).get("/api/v1/health");
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("ok");
    expect((await supertest(vercelApp).get("/api/v1/products/does-not-exist")).status).toBe(404);
  });

  // Vercel checks the entrypoint exists before running the build, so it must be
  // a committed file; it loads the tsup bundle. The bundle must stay out of
  // dist/, build/ and output/ (Vercel would serve dist/server.js from there),
  // and the service must not set outputDirectory (the function then loses its
  // node_modules and crashes with FUNCTION_INVOCATION_FAILED).
  it("points vercel.json at a committed entry that loads the Vercel bundle", async () => {
    const root = new URL("../../../", import.meta.url);
    const config = JSON.parse(readFileSync(new URL("vercel.json", root), "utf8"));
    const service = config.services.api;
    expect(service.outputDirectory).toBeUndefined();
    const entry = `${service.root}/${service.entrypoint}`;
    const tracked = execFileSync("git", ["ls-files", "--error-unmatch", entry], {
      cwd: root,
      encoding: "utf8",
    });
    expect(tracked.trim()).toBe(entry);

    const { default: tsup } = await import("../tsup.vercel.config");
    const options = tsup as { entry: Record<string, string>; outDir: string };
    expect(options.entry).toEqual({ index: "src/vercel.ts" });
    expect(["dist", "build", "output"]).not.toContain(options.outDir.split("/")[0]);
    expect(readFileSync(new URL(entry, root), "utf8")).toContain(
      `from "./${options.outDir}/index.js"`,
    );
    expect(readFileSync(new URL("../scripts/vercel-build.mjs", import.meta.url), "utf8")).toContain(
      "--config tsup.vercel.config.ts",
    );
  });
});

describe("NODE_ENV on Vercel", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  // Vercel sets NODE_ENV only for Next.js. Without this default the api
  // function loaded pino-pretty (not shipped) and crashed on every request.
  it("defaults to production when running on Vercel", async () => {
    vi.stubEnv("NODE_ENV", undefined);
    vi.stubEnv("VERCEL", "1");
    vi.resetModules();
    const { env, isProd } = await import("../src/config/env");
    expect(env.NODE_ENV).toBe("production");
    expect(isProd).toBe(true);
  });

  it("defaults to development elsewhere", async () => {
    vi.stubEnv("NODE_ENV", undefined);
    vi.stubEnv("VERCEL", undefined);
    vi.resetModules();
    const { env } = await import("../src/config/env");
    expect(env.NODE_ENV).toBe("development");
  });
});

describe("internal requests (the storefront's server-side rendering)", () => {
  const probe = express();
  probe.use(internalRequest);
  probe.get("/", (req, res) => {
    res.json({
      trusted: res.locals.trustedServer ?? false,
      leaked: req.headers[INTERNAL_HEADER] ?? null,
    });
  });

  it("skips rate limits only with the token derived from the shared secret", async () => {
    const ok = await supertest(probe).get("/").set(INTERNAL_HEADER, internalRequestToken());
    expect(ok.body).toEqual({ trusted: true, leaked: null });
    const forged = await supertest(probe).get("/").set(INTERNAL_HEADER, "guess");
    expect(forged.body).toEqual({ trusted: false, leaked: null });
    const otherSecret = internalRequestToken("x".repeat(40));
    expect((await supertest(probe).get("/").set(INTERNAL_HEADER, otherSecret)).body.trusted).toBe(
      false,
    );
  });

  it("is a stable HMAC the storefront can compute independently", () => {
    expect(internalRequestToken("a".repeat(32))).toBe(internalRequestToken("a".repeat(32)));
    expect(internalRequestToken()).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("daily cron", () => {
  it("needs the CRON_SECRET", async () => {
    expect((await supertest(app).get("/api/v1/cron/daily")).status).toBe(401);
    expect(
      (await supertest(app).get("/api/v1/cron/daily").set("Authorization", "Bearer nope")).status,
    ).toBe(401);
  });

  it("runs every daily job", async () => {
    const res = await supertest(app)
      .get("/api/v1/cron/daily")
      .set("Authorization", "Bearer test-cron-secret-0123456789");
    expect(res.status).toBe(200);
    expect(Object.keys(res.body.data)).toEqual([
      "expireOrders",
      "cartReminders",
      "reviewRequests",
      "dailyDigest",
    ]);
    expect(Object.values(res.body.data)).not.toContain("failed");
  });
});

describe("database URL", () => {
  it("adds PgBouncer and wake-up settings for hosted pooled databases", () => {
    const url = new URL(
      databaseUrl("postgresql://u:p@ep-x-pooler.ap-southeast-1.aws.neon.tech/db?sslmode=require"),
    );
    expect(url.searchParams.get("pgbouncer")).toBe("true");
    expect(url.searchParams.get("connect_timeout")).toBe("15");
    expect(url.searchParams.get("sslmode")).toBe("require");
  });

  it("leaves a local database alone", () => {
    const local = "postgresql://store:store@localhost:5432/amazon_group?schema=public";
    expect(databaseUrl(local)).toBe(local);
  });
});
