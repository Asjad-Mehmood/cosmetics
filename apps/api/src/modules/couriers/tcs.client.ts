/*
 * TCS (Pakistan) courier API client, following TCS's "API User Guide v1.0":
 *
 *   1. Authorization  GET  /auth/api/auth (clientid, clientsecret) → bearer token
 *   2. Authentication GET  /ecom/api/authentication/token (username, password) → access token
 *   3. Booking        POST /ecom/api/booking/create  → consignment number (CN)
 *                     POST /ecom/api/booking/cancel
 *                     GET  /ecom/api/print/label    → airway bill PDF
 *   4. Tracking       GET  /tracking/api/Tracking/GetDynamicTrackDetail
 *   5. Setup          GET  /ecom/api/setup/citylistbycountry
 *
 * Every call sends the bearer token in the Authorization header; e-com calls
 * also carry the access token. Both tokens are cached until shortly before
 * they expire, and fetched again once if TCS answers 401.
 */

export interface TcsCredentials {
  environment: "sandbox" | "production";
  clientId: string;
  clientSecret: string;
  username: string;
  password: string;
}

export const TCS_HOSTS = {
  sandbox: "https://devconnect.tcscourier.com",
  production: "https://ociconnect.tcscourier.com",
} as const;

/** A TCS call that failed, with TCS's own message for the admin. */
export class TcsError extends Error {
  constructor(
    message: string,
    readonly status = 502,
  ) {
    super(message);
    this.name = "TcsError";
  }
}

type Fetch = typeof fetch;
let fetchImpl: Fetch = (...args) => fetch(...args);
/** Tests replace the network with a fake TCS. */
export function setTcsFetchForTests(f: Fetch | null) {
  fetchImpl = f ?? ((...args) => fetch(...args));
  tokens.clear();
}

interface Tokens {
  bearer: string;
  access: string;
  expires: number;
}
const tokens = new Map<string, Tokens>();
const cacheKey = (c: TcsCredentials) => `${c.environment}:${c.clientId}:${c.username}`;

/** Tokens are renewed 5 minutes before TCS says they expire (or after an hour if it doesn't say). */
const expiryOf = (value: unknown) => {
  const t = typeof value === "string" ? Date.parse(value) : NaN;
  return (Number.isFinite(t) ? t : Date.now() + 60 * 60_000) - 5 * 60_000;
};

async function send(
  c: TcsCredentials,
  method: "GET" | "POST",
  path: string,
  opts: { query?: Record<string, string>; body?: unknown; bearer?: string } = {},
): Promise<Response> {
  const url = new URL(path, TCS_HOSTS[c.environment]);
  for (const [k, v] of Object.entries(opts.query ?? {})) url.searchParams.set(k, v);
  try {
    return await fetchImpl(url, {
      method,
      headers: {
        Accept: "application/json, application/pdf",
        ...(opts.body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(opts.bearer ? { Authorization: `Bearer ${opts.bearer}` } : {}),
      },
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: AbortSignal.timeout(20_000),
    });
  } catch (err) {
    const timedOut = (err as Error).name === "TimeoutError";
    throw new TcsError(
      timedOut
        ? "TCS didn't answer in time. Please try again."
        : "Couldn't reach TCS. Please try again.",
      504,
    );
  }
}

/** TCS's error message from any of its response shapes. */
function messageOf(json: unknown, fallback: string): string {
  const j = (json ?? {}) as {
    message?: unknown;
    MESSAGE?: unknown;
    error?: { [k: string]: unknown }[];
  };
  const details = Array.isArray(j.error)
    ? j.error.flatMap((e) => Object.values(e).map(String)).join("; ")
    : "";
  const msg = String(j.message ?? j.MESSAGE ?? "").trim();
  return (
    [msg && msg.toUpperCase() !== "SUCCESS" ? msg : "", details].filter(Boolean).join(": ") ||
    fallback
  );
}

async function json(res: Response): Promise<Record<string, unknown>> {
  return ((await res.json().catch(() => null)) ?? {}) as Record<string, unknown>;
}

async function login(c: TcsCredentials): Promise<Tokens> {
  const cached = tokens.get(cacheKey(c));
  if (cached && cached.expires > Date.now()) return cached;

  const authRes = await send(c, "GET", "/auth/api/auth", {
    query: { clientid: c.clientId, clientsecret: c.clientSecret },
  });
  const auth = await json(authRes);
  const result = (auth.result ?? {}) as {
    accessToken?: string;
    accesstoken?: string;
    expiry?: string;
  };
  const bearer = result.accessToken ?? result.accesstoken;
  if (!authRes.ok || !bearer) {
    throw new TcsError(
      "TCS didn't accept the client ID and secret. Check TCS_CLIENT_ID and TCS_CLIENT_SECRET on the server.",
      401,
    );
  }

  const tokenRes = await send(c, "GET", "/ecom/api/authentication/token", {
    query: { username: c.username, password: c.password },
    bearer,
  });
  const token = await json(tokenRes);
  const access = (token.accesstoken ?? token.accessToken) as string | undefined;
  if (!tokenRes.ok || !access) {
    throw new TcsError(
      "TCS didn't accept the username and password. Check TCS_USERNAME and TCS_PASSWORD on the server.",
      401,
    );
  }

  const t = { bearer, access, expires: Math.min(expiryOf(result.expiry), expiryOf(token.expiry)) };
  tokens.set(cacheKey(c), t);
  return t;
}

/** Runs a call with fresh tokens, logging in again once if TCS says they've expired. */
async function authed(
  c: TcsCredentials,
  call: (t: Tokens) => Promise<Response>,
): Promise<Response> {
  let res = await call(await login(c));
  if (res.status === 401) {
    tokens.delete(cacheKey(c));
    res = await call(await login(c));
  }
  if (res.status === 401)
    throw new TcsError("TCS refused the login. Check the TCS_* environment variables.", 401);
  return res;
}

/** Checks the credentials work (used by "Test connection"). */
export async function tcsTestLogin(c: TcsCredentials): Promise<void> {
  tokens.delete(cacheKey(c));
  await login(c);
}

export interface TcsBookingPayload {
  shipperinfo: Record<string, string>;
  consigneeinfo: Record<string, string>;
  shipmentinfo: Record<string, unknown>;
}

/** Books a shipment; returns the consignment number. */
export async function tcsCreateBooking(
  c: TcsCredentials,
  payload: TcsBookingPayload,
): Promise<string> {
  const res = await authed(c, (t) =>
    send(c, "POST", "/ecom/api/booking/create", {
      bearer: t.bearer,
      body: { accesstoken: t.access, consignmentno: "", ...payload },
    }),
  );
  const body = await json(res);
  const cn = body.consignmentNo ?? body.consignmentno;
  if (!res.ok || body.status === false || !cn) {
    throw new TcsError(
      `TCS couldn't book the parcel: ${messageOf(body, `error ${res.status}`)}`,
      502,
    );
  }
  return String(cn);
}

/** Cancels a booking (before TCS has picked the parcel up). */
export async function tcsCancelBooking(c: TcsCredentials, consignmentNo: string): Promise<void> {
  const res = await authed(c, (t) =>
    send(c, "POST", "/ecom/api/booking/cancel", {
      bearer: t.bearer,
      body: { consignmentNumber: consignmentNo, accesstoken: t.access },
    }),
  );
  const body = await json(res);
  const message = String(body.message ?? "");
  if (!res.ok || !/^success/i.test(message)) {
    throw new TcsError(
      `TCS couldn't cancel ${consignmentNo}: ${messageOf(body, `error ${res.status}`)}`,
      502,
    );
  }
}

/** The airway bill (label) PDF for a consignment. */
export async function tcsLabel(c: TcsCredentials, consignmentNo: string): Promise<Buffer> {
  const res = await authed(c, (t) =>
    send(c, "GET", "/ecom/api/print/label", {
      bearer: t.bearer,
      query: { consignmentno: consignmentNo, shipperdetail: "true", accesstoken: t.access },
    }),
  );
  const type = res.headers.get("content-type") ?? "";
  if (res.ok && type.includes("pdf")) return Buffer.from(await res.arrayBuffer());
  // Some responses give a link to the PDF instead of the file.
  const body = await json(res);
  const url = typeof body.url === "string" && body.url ? body.url : null;
  if (res.ok && url && /^https:\/\/[a-z0-9.-]*tcscourier\.com\//i.test(url)) {
    const pdf = await fetchImpl(url, { signal: AbortSignal.timeout(20_000) });
    if (pdf.ok) return Buffer.from(await pdf.arrayBuffer());
  }
  throw new TcsError(`TCS couldn't print the label: ${messageOf(body, "label not found")}`, 502);
}

export interface TcsCheckpoint {
  status: string;
  at: string;
  place: string | null;
}
export interface TcsTracking {
  /** Newest first. */
  checkpoints: TcsCheckpoint[];
  delivered: boolean;
  summary: string | null;
}

/** Tracking events for a consignment, newest first. */
export async function tcsTrack(c: TcsCredentials, consignmentNo: string): Promise<TcsTracking> {
  const res = await authed(c, (t) =>
    send(c, "GET", "/tracking/api/Tracking/GetDynamicTrackDetail", {
      bearer: t.bearer,
      query: { consignee: consignmentNo },
    }),
  );
  const body = await json(res);
  if (!res.ok)
    throw new TcsError(`TCS tracking failed: ${messageOf(body, `error ${res.status}`)}`, 502);
  type Row = { status?: string; datetime?: string; recievedby?: string | null; code?: string };
  const checkpoints = ((body.checkpoints as Row[] | null) ?? []).map((r) => ({
    status: String(r.status ?? "").trim(),
    at: String(r.datetime ?? "")
      .replace(/\s+/g, " ")
      .trim(),
    place: r.recievedby ? String(r.recievedby) : null,
  }));
  const delivery = (body.deliveryinfo as Row[] | null) ?? [];
  const summary = typeof body.shipmentsummary === "string" ? body.shipmentsummary : null;
  const delivered =
    delivery.some((d) => d.code === "OK" || /^delivered$/i.test(String(d.status ?? "").trim())) ||
    /current status:\s*delivered/i.test(summary ?? "");
  return { checkpoints: checkpoints.filter((c) => c.status), delivered, summary };
}

/** TCS's cities in Pakistan (name + code). */
export async function tcsCities(c: TcsCredentials): Promise<{ code: string; name: string }[]> {
  const res = await authed(c, (t) =>
    send(c, "GET", "/ecom/api/setup/citylistbycountry", {
      bearer: t.bearer,
      query: { countrycode: "PK", accesstoken: t.access },
    }),
  );
  const body = await json(res);
  const rows = (body.data as { citycode?: string; cityname?: string }[] | undefined) ?? [];
  if (!res.ok || !rows.length)
    throw new TcsError(`TCS city list failed: ${messageOf(body, `error ${res.status}`)}`);
  return rows
    .filter((r) => r.cityname)
    .map((r) => ({ code: String(r.citycode ?? ""), name: String(r.cityname).trim().toUpperCase() }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
