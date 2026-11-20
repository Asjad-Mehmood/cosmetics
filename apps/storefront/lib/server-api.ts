import type { ApiResponse, PaginatedResponse } from "@store/types";
import { createHmac } from "node:crypto";
import { unstable_cache } from "next/cache";
import { connection } from "next/server";

interface FetchOptions {
  /** Seconds to cache the API response. */
  revalidate?: number;
}

/**
 * Base URL of the `api` service. On Vercel the `API_URL` service binding
 * (vercel.json → services.storefront.bindings) injects it at runtime; with
 * `vercel dev` it is injected too. For plain `pnpm dev` / e2e runs the API
 * listens on port 4000.
 */
function apiBase(): string {
  const base = process.env.API_URL ?? (process.env.VERCEL ? undefined : "http://localhost:4000");
  if (!base) throw new Error("API_URL is not set: check the api service binding in vercel.json");
  return base.endsWith("/") ? base : `${base}/`;
}

/**
 * Lets these server-side reads skip the API's per-IP rate limits (they all
 * come from the storefront's servers). Same derivation as the API's
 * middleware/internal-request.ts, from the project's shared JWT_ACCESS_SECRET.
 */
function internalToken(): string | undefined {
  const secret = process.env.JWT_ACCESS_SECRET;
  return secret
    ? createHmac("sha256", secret).update("amazon-group:internal-request").digest("hex")
    : undefined;
}

/** GET from the api service. 404 → null. */
async function load(path: string): Promise<string | null> {
  const token = internalToken();
  const res = await fetch(new URL(`api/v1${path}`, apiBase()), {
    headers: { accept: "application/json", ...(token ? { "x-internal-request": token } : {}) },
    // Caching is done by unstable_cache below (errors are never cached).
    cache: "no-store",
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`API ${res.status} for GET ${path}`);
  return res.text();
}

/**
 * Server-side GET to the public API.
 *
 * `connection()` makes the calling page render at request time (so the build
 * never needs the database), while responses are cached for `revalidate`
 * seconds so pages stay fast. Errors are never cached.
 */
async function get<T>(path: string, { revalidate = 60 }: FetchOptions = {}): Promise<T | null> {
  await connection();
  const body = await unstable_cache(load, ["api-get", String(revalidate)], { revalidate })(path);
  return body === null ? null : (JSON.parse(body) as T);
}

/** `data` of a single-resource response, or null on 404. */
export async function getData<T>(path: string, opts?: FetchOptions): Promise<T | null> {
  return (await get<ApiResponse<T>>(path, opts))?.data ?? null;
}

/** A paginated list response. */
export async function getList<T>(path: string, opts?: FetchOptions): Promise<PaginatedResponse<T>> {
  const res = await get<PaginatedResponse<T>>(path, opts);
  if (!res) throw new Error(`API 404 for GET ${path}`);
  return res;
}

/** Like getData but never throws: for non-essential data such as navigation. */
export async function getDataSafe<T>(path: string, fallback: T, opts?: FetchOptions): Promise<T> {
  try {
    return (await getData<T>(path, opts)) ?? fallback;
  } catch {
    return fallback;
  }
}
