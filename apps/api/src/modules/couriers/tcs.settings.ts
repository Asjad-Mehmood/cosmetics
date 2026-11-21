import type { TcsSettingsDTO } from "@store/types";
import type { TcsSettingsInput } from "@store/validation";
import type { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { decryptSecret, encryptSecret } from "../../lib/secrets";
import { storeInfo } from "../../lib/settings";
import type { TcsCredentials } from "./tcs.client";

/*
 * TCS settings live in the Setting table under "tcs.*". The client secret and
 * password are encrypted (lib/secrets) and never sent back to the browser.
 */
const KEYS = [
  "tcs.enabled",
  "tcs.environment",
  "tcs.clientId",
  "tcs.clientSecret",
  "tcs.username",
  "tcs.password",
  "tcs.accountNumber",
  "tcs.costCenterCode",
  "tcs.serviceCode",
  "tcs.shipperName",
  "tcs.shipperAddress",
  "tcs.shipperCity",
  "tcs.shipperMobile",
  "tcs.defaultWeightKg",
] as const;

export interface TcsConfig extends Omit<TcsSettingsDTO, "hasClientSecret" | "hasPassword"> {
  credentials: TcsCredentials | null;
}

const str = (v: unknown) => (typeof v === "string" ? v : "");

export async function loadTcsConfig(): Promise<TcsConfig> {
  const [rows, store] = await Promise.all([
    prisma.setting.findMany({ where: { key: { in: [...KEYS] } } }),
    storeInfo(),
  ]);
  const s = Object.fromEntries(rows.map((r) => [r.key, r.value])) as Record<string, unknown>;
  const environment: "sandbox" | "production" =
    s["tcs.environment"] === "production" ? "production" : "sandbox";
  const clientSecret = decryptSecret(s["tcs.clientSecret"]);
  const password = decryptSecret(s["tcs.password"]);
  const base = {
    enabled: s["tcs.enabled"] === true,
    environment,
    clientId: str(s["tcs.clientId"]),
    username: str(s["tcs.username"]),
    accountNumber: str(s["tcs.accountNumber"]),
    costCenterCode: str(s["tcs.costCenterCode"]),
    serviceCode: str(s["tcs.serviceCode"]) || "O",
    shipperName: str(s["tcs.shipperName"]) || store.name,
    shipperAddress: str(s["tcs.shipperAddress"]) || store.address,
    shipperCity: str(s["tcs.shipperCity"]) || "LAHORE",
    shipperMobile: str(s["tcs.shipperMobile"]),
    defaultWeightKg: Number(s["tcs.defaultWeightKg"]) || 0.5,
  } as const;
  const credentials =
    base.clientId && clientSecret && base.username && password
      ? { environment, clientId: base.clientId, clientSecret, username: base.username, password }
      : null;
  const configured =
    !!credentials &&
    !!base.accountNumber &&
    !!base.costCenterCode &&
    base.shipperName.length >= 3 &&
    base.shipperAddress.length >= 3 &&
    /^0\d{10}$/.test(base.shipperMobile);
  return { ...base, credentials, configured };
}

export async function tcsSettingsDTO(): Promise<TcsSettingsDTO> {
  const { credentials, ...c } = await loadTcsConfig();
  const rows = await prisma.setting.findMany({
    where: { key: { in: ["tcs.clientSecret", "tcs.password"] } },
  });
  const has = (k: string) => decryptSecret(rows.find((r) => r.key === k)?.value) !== null;
  void credentials;
  return { ...c, hasClientSecret: has("tcs.clientSecret"), hasPassword: has("tcs.password") };
}

/** Saves the settings; empty secrets keep the ones already stored. Returns the changed keys. */
export async function saveTcsSettings(input: TcsSettingsInput): Promise<string[]> {
  const { clientSecret, password, ...plain } = input;
  const values: Record<string, Prisma.InputJsonValue> = Object.fromEntries(
    Object.entries(plain).map(([k, v]) => [`tcs.${k}`, v as Prisma.InputJsonValue]),
  );
  if (clientSecret) values["tcs.clientSecret"] = encryptSecret(clientSecret);
  if (password) values["tcs.password"] = encryptSecret(password);
  await prisma.$transaction(
    Object.entries(values).map(([key, value]) =>
      prisma.setting.upsert({ where: { key }, create: { key, value }, update: { value } }),
    ),
  );
  return Object.keys(values);
}
