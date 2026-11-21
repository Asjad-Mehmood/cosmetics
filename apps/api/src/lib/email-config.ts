import { env } from "../config/env";
import { prisma } from "./prisma";
import { decryptSecret } from "./secrets";

/**
 * How emails are sent. The email login (SMTP password or Resend API key) is
 * read from the server's environment variables (set in Vercel), never typed
 * into the admin:
 *
 *   SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASSWORD   (any SMTP server)
 *   RESEND_API_KEY                                                (or Resend)
 *   EMAIL_FROM                                                    (sender)
 *
 * Stores that set email up in the admin before this change keep working from
 * those saved (encrypted) settings until the environment variables are added;
 * the admin then offers to delete the saved copy. Until either exists, no email
 * is sent at all.
 */
export type EmailConfig =
  | {
      provider: "smtp";
      from: string;
      smtp: { host: string; port: number; secure: boolean; user: string; password: string };
    }
  | { provider: "resend"; from: string; apiKey: string };

export const EMAIL_KEYS = [
  "email.provider",
  "email.from",
  "email.smtp.host",
  "email.smtp.port",
  "email.smtp.secure",
  "email.smtp.user",
  "email.smtp.password",
  "email.resend.apiKey",
] as const;

export type EmailSettingsRaw = Partial<Record<(typeof EMAIL_KEYS)[number], unknown>>;

export async function readEmailSettings(): Promise<EmailSettingsRaw> {
  const rows = await prisma.setting.findMany({ where: { key: { in: [...EMAIL_KEYS] } } });
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

const str = (v: unknown) => (typeof v === "string" ? v : "");

/** Email from the environment variables, or null if they aren't set. */
export function envEmailConfig(): EmailConfig | null {
  const from = env.EMAIL_FROM;
  if (env.SMTP_HOST?.trim() && env.SMTP_PASSWORD) {
    return {
      provider: "smtp",
      from,
      smtp: {
        host: env.SMTP_HOST.trim(),
        port: env.SMTP_PORT,
        secure: env.SMTP_SECURE,
        user: env.SMTP_USER?.trim() ?? "",
        password: env.SMTP_PASSWORD,
      },
    };
  }
  if (env.RESEND_API_KEY?.trim()) {
    return { provider: "resend", from, apiKey: env.RESEND_API_KEY.trim() };
  }
  return null;
}

/** Email settings saved in the admin before the login moved to the environment (legacy). */
export function savedEmailConfig(s: EmailSettingsRaw): EmailConfig | null {
  const from = str(s["email.from"]) || env.EMAIL_FROM;
  if (s["email.provider"] === "smtp") {
    const password = decryptSecret(s["email.smtp.password"]);
    const host = str(s["email.smtp.host"]);
    if (!host || password === null) return null;
    return {
      provider: "smtp",
      from,
      smtp: {
        host,
        port: Number(s["email.smtp.port"]) || 587,
        secure: s["email.smtp.secure"] === true,
        user: str(s["email.smtp.user"]),
        password,
      },
    };
  }
  if (s["email.provider"] === "resend") {
    const apiKey = decryptSecret(s["email.resend.apiKey"]);
    return apiKey ? { provider: "resend", from, apiKey } : null;
  }
  return null;
}

/** The environment variables win; a login saved in the admin earlier is the fallback. */
export async function resolveEmailConfig(): Promise<{
  config: EmailConfig | null;
  source: "environment" | "admin" | null;
}> {
  const fromEnv = envEmailConfig();
  if (fromEnv) return { config: fromEnv, source: "environment" };
  const saved = savedEmailConfig(await readEmailSettings());
  return saved ? { config: saved, source: "admin" } : { config: null, source: null };
}

// Cached briefly: every email (and some pages) ask whether email is set up.
let cache: { at: number; value: EmailConfig | null } | null = null;
const TTL = 30_000;

export async function loadEmailConfig(): Promise<EmailConfig | null> {
  if (cache && Date.now() - cache.at < TTL) return cache.value;
  const { config } = await resolveEmailConfig();
  cache = { at: Date.now(), value: config };
  return config;
}

export const emailEnabled = async () => (await loadEmailConfig()) !== null;

/** Call after the settings change. */
export function clearEmailConfigCache() {
  cache = null;
}
