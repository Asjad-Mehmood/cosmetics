import {
  ErrorCode,
  type OrderAddressDTO,
  type OrderStatus,
  type TcsBookingDraftDTO,
  type TcsCityDTO,
} from "@store/types";
import type { TcsBookingInput } from "@store/validation";
import { logger } from "../../lib/logger";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/app-error";
import { updateOrderStatus } from "../orders/lifecycle";
import {
  TcsError,
  tcsCancelBooking,
  tcsCities,
  tcsCreateBooking,
  tcsLabel,
  tcsTrack,
  type TcsCheckpoint,
} from "./tcs.client";
import { loadTcsConfig, type TcsConfig } from "./tcs.settings";

/** Shown as the author of status changes made by TCS tracking. */
export const TCS_ACTOR = "courier:tcs";

/** Orders that can be booked: confirmed or paid, and not yet with a courier. */
const BOOKABLE: OrderStatus[] = ["CONFIRMED", "PAID", "PROCESSING", "PACKED"];
/** Orders whose TCS tracking is still worth checking. */
const TRACKED: OrderStatus[] = ["PACKED", "SHIPPED", "IN_TRANSIT", "OUT_FOR_DELIVERY"];

async function requireConfig(): Promise<
  TcsConfig & { credentials: NonNullable<TcsConfig["credentials"]> }
> {
  const config = await loadTcsConfig();
  if (!config.enabled || !config.configured || !config.credentials) {
    throw new AppError(
      ErrorCode.CONFLICT,
      "TCS isn't set up yet. Add the TCS login to the server's environment variables, then turn TCS on in Settings → TCS courier.",
      undefined,
      409,
    );
  }
  return config as TcsConfig & { credentials: NonNullable<TcsConfig["credentials"]> };
}

/** Turns a TCS failure into a clear API error (502, or 409 for bad settings). */
function rethrow(err: unknown): never {
  if (err instanceof TcsError) {
    throw new AppError(ErrorCode.CONFLICT, err.message, undefined, err.status === 401 ? 409 : 502);
  }
  throw err;
}

// ───────────── Cities ─────────────

const CITY_CACHE = "tcs.cities";
const WEEK = 7 * 24 * 60 * 60_000;

/** TCS's city list, cached for a week (it rarely changes). */
export async function tcsCityList(): Promise<TcsCityDTO[]> {
  const cached = await prisma.setting.findUnique({ where: { key: CITY_CACHE } });
  const value = cached?.value as { at?: number; cities?: TcsCityDTO[] } | undefined;
  if (value?.cities?.length && Date.now() - (value.at ?? 0) < WEEK) return value.cities;
  const config = await requireConfig();
  try {
    const cities = await tcsCities(config.credentials);
    const stored = { at: Date.now(), cities };
    await prisma.setting.upsert({
      where: { key: CITY_CACHE },
      create: { key: CITY_CACHE, value: stored },
      update: { value: stored },
    });
    return cities;
  } catch (err) {
    if (value?.cities?.length) return value.cities;
    rethrow(err);
  }
}

const norm = (s: string) => s.toUpperCase().replace(/[^A-Z]/g, "");
/** The TCS city for an address's city, e.g. "lahore" → LAHORE. */
export function matchCity(city: string, cities: TcsCityDTO[]): TcsCityDTO | null {
  const want = norm(city);
  if (!want) return null;
  return (
    cities.find((c) => norm(c.name) === want) ??
    cities.find((c) => norm(c.name).startsWith(want) || want.startsWith(norm(c.name))) ??
    null
  );
}

// ───────────── Booking ─────────────

/** Pakistani mobile in TCS's format, 03001234567. */
export const tcsMobile = (phone: string) => {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("92") && digits.length === 12) return `0${digits.slice(2)}`;
  if (digits.length === 10 && digits.startsWith("3")) return `0${digits}`;
  return digits;
};

async function loadOrder(number: string) {
  const order = await prisma.order.findUnique({
    where: { orderNumber: number },
    include: { items: true, payments: { orderBy: { createdAt: "desc" } } },
  });
  if (!order) throw AppError.notFound("Order");
  return order;
}
type BookableOrder = Awaited<ReturnType<typeof loadOrder>>;

/** Cash the rider collects: the order total for unpaid Cash on Delivery orders. */
const codAmount = (o: BookableOrder) =>
  o.paymentMethod === "COD" && o.payments[0]?.status !== "SUCCEEDED" ? o.grandTotal : 0;

const description = (o: BookableOrder) =>
  o.items
    .map((i) => `${i.productTitle} x${i.quantity}`)
    .join(", ")
    .slice(0, 200);

export async function bookingDraft(number: string): Promise<TcsBookingDraftDTO> {
  const order = await loadOrder(number);
  const config = await loadTcsConfig();
  const address = order.shippingAddress as unknown as OrderAddressDTO;
  let cities: TcsCityDTO[] = [];
  if (config.enabled && config.configured) {
    try {
      cities = await tcsCityList();
    } catch (err) {
      logger.warn({ err }, "TCS city list unavailable");
    }
  }
  return {
    configured: config.enabled && config.configured,
    city: matchCity(address.city, cities),
    cities,
    weightKg: config.defaultWeightKg,
    pieces: 1,
    codAmount: codAmount(order),
    description: description(order),
  };
}

/** Books the order with TCS, saves the consignment number and marks it packed. */
export async function bookWithTcs(number: string, input: TcsBookingInput, staffId: string) {
  const config = await requireConfig();
  const order = await loadOrder(number);
  if (order.courierBookedAt) {
    throw AppError.conflict(
      `Order ${number} is already booked with TCS (${order.trackingNumber}).`,
    );
  }
  if (!BOOKABLE.includes(order.status)) {
    throw AppError.conflict(
      `An order that is ${order.status.toLowerCase().replace(/_/g, " ")} can't be booked.`,
    );
  }
  const a = order.shippingAddress as unknown as OrderAddressDTO;
  const [first, ...rest] = a.fullName.trim().split(/\s+/);
  const cod = Math.round(codAmount(order) / 100);
  const weight = Math.max(0.5, input.weightKg);

  let cn: string;
  try {
    cn = await tcsCreateBooking(config.credentials, {
      shipperinfo: {
        tcsaccount: config.accountNumber,
        shippername: config.shipperName.slice(0, 50),
        address1: config.shipperAddress.slice(0, 120),
        countrycode: "PK",
        countryname: "Pakistan",
        cityname: config.shipperCity.toUpperCase(),
        mobile: config.shipperMobile,
      },
      consigneeinfo: {
        firstname: (first ?? a.fullName).padEnd(3, ".").slice(0, 50),
        middlename: (rest.join(" ") || first || a.fullName).padEnd(3, ".").slice(0, 50),
        lastname: "",
        address1: a.line1.slice(0, 120),
        ...(a.line2 ? { address2: a.line2.slice(0, 120) } : {}),
        ...(a.postalCode ? { zip: a.postalCode.slice(0, 6) } : {}),
        countrycode: "PK",
        countryname: "Pakistan",
        ...(input.cityCode ? { citycode: input.cityCode } : {}),
        cityname: input.cityName.toUpperCase(),
        email: order.email.slice(0, 50),
        mobile: tcsMobile(a.phone || order.phone),
      },
      shipmentinfo: {
        costcentercode: config.costCenterCode,
        referenceno: order.orderNumber,
        contentdesc: description(order).slice(0, 50) || "Order",
        servicecode: config.serviceCode,
        currency: "PKR",
        codamount: cod,
        weightinkg: weight,
        pieces: input.pieces,
        fragile: input.fragile,
        ...(input.remarks ? { remarks: input.remarks } : {}),
        skus: order.items.map((i) => ({
          description: i.productTitle.slice(0, 50),
          quantity: i.quantity,
          weight: Math.max(0.5, Math.round((weight / order.items.length) * 10) / 10),
          uom: "KG",
          unitprice: Math.max(1, Math.round(i.unitPrice / 100)),
        })),
      },
    });
  } catch (err) {
    rethrow(err);
  }

  await prisma.order.update({
    where: { id: order.id },
    data: {
      courier: "TCS",
      trackingNumber: cn,
      courierBookedAt: new Date(),
      courierStatus: "Booked with TCS",
      courierSyncedAt: new Date(),
    },
  });
  // Booked means packed and waiting for the TCS rider.
  const note = `Booked with TCS, consignment ${cn}`;
  if (order.status === "CONFIRMED" || order.status === "PAID") {
    await updateOrderStatus(order.id, { status: "PROCESSING" }, staffId);
  }
  if (order.status !== "PACKED") {
    await updateOrderStatus(order.id, { status: "PACKED", note }, staffId);
  } else {
    await prisma.orderStatusHistory.create({
      data: { orderId: order.id, status: "PACKED", note, changedBy: staffId },
    });
  }
  return cn;
}

/** Cancels the TCS booking (only before TCS has picked the parcel up). */
export async function cancelTcsBooking(number: string, staffId: string) {
  const config = await requireConfig();
  const order = await loadOrder(number);
  if (!order.courierBookedAt || !order.trackingNumber) {
    throw AppError.conflict(`Order ${number} isn't booked with TCS.`);
  }
  if (order.status !== "PACKED") {
    throw AppError.conflict(
      "TCS has already collected this parcel, so the booking can't be cancelled here.",
    );
  }
  try {
    await tcsCancelBooking(config.credentials, order.trackingNumber);
  } catch (err) {
    rethrow(err);
  }
  await prisma.$transaction([
    prisma.order.update({
      where: { id: order.id },
      data: {
        courier: null,
        trackingNumber: null,
        courierBookedAt: null,
        courierStatus: null,
        courierSyncedAt: null,
      },
    }),
    prisma.orderStatusHistory.create({
      data: {
        orderId: order.id,
        status: order.status,
        note: `TCS booking ${order.trackingNumber} cancelled`,
        changedBy: staffId,
      },
    }),
  ]);
}

export async function tcsLabelPdf(number: string): Promise<{ pdf: Buffer; cn: string }> {
  const config = await requireConfig();
  const order = await loadOrder(number);
  if (!order.courierBookedAt || !order.trackingNumber) {
    throw AppError.conflict(`Order ${number} isn't booked with TCS.`);
  }
  try {
    return {
      pdf: await tcsLabel(config.credentials, order.trackingNumber),
      cn: order.trackingNumber,
    };
  } catch (err) {
    rethrow(err);
  }
}

// ───────────── Tracking ─────────────

const STEPS: OrderStatus[] = ["PACKED", "SHIPPED", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED"];

/** Which of our statuses a TCS checkpoint means (null: no change, e.g. "Booked" or a return). */
export function statusForCheckpoint(status: string): OrderStatus | null {
  const s = status.toLowerCase();
  if (/return|rto|refused|undeliver/.test(s)) return null;
  if (/deliver(ed|y completed)|shipment delivered/.test(s) && !/out for/.test(s))
    return "DELIVERED";
  if (/out for delivery|on route|with courier for delivery/.test(s)) return "OUT_FOR_DELIVERY";
  if (/arriv|depart|transit|dispatch|forward|received at|in process|hub|facility/.test(s))
    return "IN_TRANSIT";
  if (/picked|pick up|picked up|collected|shipment received/.test(s)) return "SHIPPED";
  return null;
}

/** The furthest status the TCS events reach. */
export function targetStatus(t: {
  checkpoints: TcsCheckpoint[];
  delivered: boolean;
}): OrderStatus | null {
  if (t.delivered) return "DELIVERED";
  let best = -1;
  for (const c of t.checkpoints) {
    const s = statusForCheckpoint(c.status);
    if (s) best = Math.max(best, STEPS.indexOf(s));
  }
  return best >= 0 ? STEPS[best]! : null;
}

const describe = (c: TcsCheckpoint | undefined) =>
  c ? `${c.status}${c.place ? `, ${c.place}` : ""}` : null;

/**
 * Fetches TCS tracking for a booked order and moves it forward to match
 * (never backwards). Each step is recorded with TCS's own wording, and the
 * usual customer emails go out (shipped, out for delivery, delivered).
 */
export async function syncTcsTracking(orderId: string, opts: { force?: boolean } = {}) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (
    !order ||
    order.courier !== "TCS" ||
    !order.trackingNumber ||
    !TRACKED.includes(order.status)
  ) {
    return { changed: false as const };
  }
  if (
    !opts.force &&
    order.courierSyncedAt &&
    Date.now() - order.courierSyncedAt.getTime() < 30 * 60_000
  ) {
    return { changed: false as const };
  }
  const config = await loadTcsConfig();
  if (!config.enabled || !config.credentials) return { changed: false as const };

  let tracking;
  try {
    tracking = await tcsTrack(config.credentials, order.trackingNumber);
  } catch (err) {
    if (opts.force) rethrow(err);
    logger.warn({ err, order: order.orderNumber }, "TCS tracking failed");
    return { changed: false as const };
  }
  const latest = describe(tracking.checkpoints[0]);
  await prisma.order.update({
    where: { id: order.id },
    data: { courierSyncedAt: new Date(), ...(latest ? { courierStatus: latest } : {}) },
  });

  const target = targetStatus(tracking);
  const from = STEPS.indexOf(order.status);
  const to = target ? STEPS.indexOf(target) : -1;
  if (to <= from) return { changed: false as const, status: order.status };

  // Step forward along the allowed path (packed → shipped → … → delivered).
  let current = order.status;
  for (const step of STEPS.slice(from + 1, to + 1)) {
    const skippable = step === "IN_TRANSIT" || step === "OUT_FOR_DELIVERY";
    if (skippable && step !== target) continue;
    const at = tracking.checkpoints.find((c) => statusForCheckpoint(c.status) === step);
    await updateOrderStatus(
      order.id,
      { status: step, note: `TCS: ${describe(at) ?? latest ?? step.toLowerCase()}` },
      TCS_ACTOR,
    );
    current = step;
  }
  return { changed: true as const, status: current };
}

/** Customer views: refresh quietly (at most every 30 minutes), never slowing the page much. */
export async function refreshTcsQuietly(
  orderId: string,
  courier: string | null,
  status: OrderStatus,
) {
  if (courier !== "TCS" || !TRACKED.includes(status)) return;
  await Promise.race([
    syncTcsTracking(orderId).catch((err) => logger.warn({ err }, "TCS refresh failed")),
    new Promise((r) => setTimeout(r, 4000)),
  ]);
}

/** Daily job: refresh every order still with TCS. */
export async function syncAllTcsTracking() {
  const orders = await prisma.order.findMany({
    where: { courier: "TCS", trackingNumber: { not: null }, status: { in: TRACKED } },
    select: { id: true },
    orderBy: { updatedAt: "asc" },
    take: 300,
  });
  let changed = 0;
  for (const o of orders) {
    const r = await syncTcsTracking(o.id, { force: false }).catch(() => ({ changed: false }));
    if (r.changed) changed++;
  }
  return { checked: orders.length, changed };
}
