/**
 * Vercel entry for the `api` service (vercel.json → services.api), bundled to
 * dist/vercel/index.js by tsup.vercel.config.ts. Vercel runs the exported Express app as one function and
 * routes public /api/* requests to it with their path unchanged (/api/v1/…).
 *
 * No background worker runs on Vercel: jobs run inline (see jobs/queue.ts)
 * and scheduled jobs run from the daily cron request.
 */
import { createApp } from "./app";

export default createApp();
