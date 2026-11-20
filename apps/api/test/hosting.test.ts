import express from "express";
import supertest from "supertest";
import { describe, expect, it } from "vitest";
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
