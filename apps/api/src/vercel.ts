/**
 * The `api` Vercel service app (vercel.json → services.api), bundled to
 * vercel-bundle/index.js by tsup.vercel.config.ts and loaded by vercel-entry.js. Vercel runs the exported Express app as one function and
 * routes public /api/* requests to it with their path unchanged (/api/v1/…).
 *
 * No background worker runs on Vercel: jobs run inline (see jobs/queue.ts)
 * and scheduled jobs run from the daily cron request.
 */
import { createApp } from "./app";

export default createApp();
