import type { TcsSettingsDTO } from "@store/types";
import type { TcsSettingsInput } from "@store/validation";
import type { Prisma } from "@prisma/client";
import { env } from "../../config/env";
import { prisma } from "../../lib/prisma";
import { storeInfo } from "../../lib/settings";
import type { TcsCredentials } from "./tcs.client";

/*
 * TCS configuration comes from two places:
 *
 * - The TCS API login (client ID and secret, username, password, account
 *   number, cost center) is read ONLY from the server's environment variables
 *   (TCS_*, set in Vercel). It is never stored in the database, never sent to
 *   the browser and can't be changed from the admin, so a stolen admin login
 *   can't reveal or redirect it.
 * - Operational details (on/off, service, pickup address, usual weight) are
 *   kept in the Setting table under "tcs.*" and edited in the admin.
 */
const KEYS = [
  "tcs.enabled",
  "tcs.serviceCode",
  "tcs.shipperName",
  "tcs.shipperAddress",
  "tcs.shipperCity",
  "tcs.shipperMobile",
  "tcs.defaultWeightKg",
] as const;

/** The environment variables a TCS booking needs. */
const REQUIRED_ENV = [
  "TCS_CLIENT_ID",
  "TCS_CLIENT_SECRET",
  "TCS_USERNAME",
  "TCS_PASSWORD",
  "TCS_ACCOUNT_NUMBER",
  "TCS_COST_CENTER_CODE",
] as const;

export interface TcsConfig extends TcsSettingsDTO {
  credentials: TcsCredentials | null;
}

const str = (v: unknown) => (typeof v === "string" ? v : "");

export async function loadTcsConfig(): Promise<TcsConfig> {
  const [rows, store] = await Promise.all([
    prisma.setting.findMany({ where: { key: { in: [...KEYS] } } }),
    storeInfo(),
  ]);
  const s = Object.fromEntries(rows.map((r) => [r.key, r.value])) as Record<string, unknown>;
  const missingEnv = REQUIRED_ENV.filter((k) => !env[k]?.trim());
  const credentials: TcsCredentials | null =
    env.TCS_CLIENT_ID && env.TCS_CLIENT_SECRET && env.TCS_USERNAME && env.TCS_PASSWORD
      ? {
          environment: env.TCS_ENV,
          clientId: env.TCS_CLIENT_ID.trim(),
          clientSecret: env.TCS_CLIENT_SECRET.trim(),
          username: env.TCS_USERNAME.trim(),
          password: env.TCS_PASSWORD,
        }
      : null;
  const config = {
    enabled: s["tcs.enabled"] === true,
    environment: env.TCS_ENV,
    missingEnv: [...missingEnv],
    accountNumber: env.TCS_ACCOUNT_NUMBER?.trim() ?? "",
    costCenterCode: env.TCS_COST_CENTER_CODE?.trim() ?? "",
    serviceCode: str(s["tcs.serviceCode"]) || "O",
    shipperName: str(s["tcs.shipperName"]) || store.name,
    shipperAddress: str(s["tcs.shipperAddress"]) || store.address,
    shipperCity: str(s["tcs.shipperCity"]) || "LAHORE",
    shipperMobile: str(s["tcs.shipperMobile"]),
    defaultWeightKg: Number(s["tcs.defaultWeightKg"]) || 0.5,
  };
  const configured =
    missingEnv.length === 0 &&
    config.shipperName.length >= 3 &&
    config.shipperAddress.length >= 3 &&
    /^0\d{10}$/.test(config.shipperMobile);
  return { ...config, configured, credentials };
}

export async function tcsSettingsDTO(): Promise<TcsSettingsDTO> {
  const { credentials: _secret, ...dto } = await loadTcsConfig();
  return dto;
}

/** Saves the admin-editable details. Returns the keys written. */
export async function saveTcsSettings(input: TcsSettingsInput): Promise<string[]> {
  const values = Object.entries(input).map(
    ([k, v]) => [`tcs.${k}`, v as Prisma.InputJsonValue] as const,
  );
  await prisma.$transaction(
    values.map(([key, value]) =>
      prisma.setting.upsert({ where: { key }, create: { key, value }, update: { value } }),
    ),
  );
  return values.map(([k]) => k);
}
