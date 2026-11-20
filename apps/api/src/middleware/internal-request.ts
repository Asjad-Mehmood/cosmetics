import type { RequestHandler } from "express";
import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "../config/env";

/**
 * The storefront's server-side rendering reads the catalogue from this API
 * over the `API_URL` service binding. All those reads come from the
 * storefront's servers, so they would quickly hit the per-IP rate limits;
 * with this header they skip them.
 *
 * The token is derived from JWT_ACCESS_SECRET, which both services already
 * share (one Vercel project, one set of environment variables), so there is
 * nothing extra to configure and nobody outside the project can produce it.
 * The storefront computes the same value in lib/server-api.ts.
 */
export const internalRequestToken = (secret = env.JWT_ACCESS_SECRET): string =>
  createHmac("sha256", secret).update("amazon-group:internal-request").digest("hex");

export const INTERNAL_HEADER = "x-internal-request";

export const internalRequest: RequestHandler = (req, res, next) => {
  const given = req.headers[INTERNAL_HEADER];
  delete req.headers[INTERNAL_HEADER];
  const expected = internalRequestToken();
  if (
    typeof given === "string" &&
    given.length === expected.length &&
    timingSafeEqual(Buffer.from(given), Buffer.from(expected))
  ) {
    res.locals.trustedServer = true;
  }
  next();
};
