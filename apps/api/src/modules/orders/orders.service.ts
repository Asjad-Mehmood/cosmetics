import { refreshTcsQuietly } from "../couriers/tcs.service";
import type { OrderDTO, PaymentSessionDTO } from "@store/types";
import type { ReturnRequestInput } from "@store/validation";
import { paginated, skipTake } from "../../lib/http";
import { requestReturn, returnWindowDays } from "../returns/returns.service";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/app-error";
import { getPaymentProvider } from "../payments";
import { cancelOrder } from "./lifecycle";
import { isValidOrderToken } from "./order-access";
import {
  CUSTOMER_CANCELLABLE,
  canPay,
  orderInclude,
  toOrderDTO,
  toOrderListItem,
  toTracking,
  type FullOrder,
} from "./order.mapper";

export interface Viewer {
  userId?: string;
  token?: string;
}

/**
 * Finds an order the viewer may see: their own (signed in), or any order with a
 * valid link token. Anything else is a 404, so order numbers cannot be probed.
 */
export async function findViewableOrder(number: string, viewer: Viewer): Promise<FullOrder> {
  const order = await prisma.order.findUnique({
    where: { orderNumber: number.toUpperCase() },
    include: orderInclude,
  });
  const allowed =
    order &&
    ((viewer.userId && order.userId === viewer.userId) ||
      isValidOrderToken(order.id, viewer.token));
  if (!order || !allowed) throw AppError.notFound("Order");
  return order;
}

export async function getOrder(number: string, viewer: Viewer): Promise<OrderDTO> {
  let order = await findViewableOrder(number, viewer);
  // Parcels with TCS: pick up the latest tracking first (at most every 30 minutes).
  if (order.courier === "TCS") {
    await refreshTcsQuietly(order.id, order.courier, order.status);
    order = await findViewableOrder(number, viewer);
  }
  return toOrderDTO(order, await returnWindowDays());
}

/** Customer return request (owner or order-link holder). */
export async function requestReturnByCustomer(
  number: string,
  viewer: Viewer,
  input: ReturnRequestInput,
): Promise<OrderDTO> {
  const order = await findViewableOrder(number, viewer);
  await requestReturn(order.id, input);
  return getOrder(number, viewer);
}

export async function listMyOrders(userId: string, page: { page: number; limit: number }) {
  const where = { userId };
  const [rows, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { items: true },
      orderBy: { placedAt: "desc" },
      ...skipTake(page),
    }),
    prisma.order.count({ where }),
  ]);
  return paginated(rows.map(toOrderListItem), { ...page, total });
}

/** "Track my order" with the order number and the email it was placed with. */
export async function trackOrder(number: string, email: string) {
  const order = await prisma.order.findUnique({
    where: { orderNumber: number },
    include: orderInclude,
  });
  if (!order || order.email.toLowerCase() !== email) {
    throw AppError.notFound("We couldn't find an order with that number and email");
  }
  if (order.courier === "TCS") {
    await refreshTcsQuietly(order.id, order.courier, order.status);
    const fresh = await prisma.order.findUniqueOrThrow({
      where: { id: order.id },
      include: orderInclude,
    });
    return toTracking(fresh);
  }
  return toTracking(order);
}

export async function cancelByCustomer(number: string, viewer: Viewer): Promise<OrderDTO> {
  const order = await findViewableOrder(number, viewer);
  const updated = await cancelOrder(order.id, {
    reason: "Cancelled by the customer.",
    changedBy: viewer.userId ?? null,
    allowed: [...CUSTOMER_CANCELLABLE],
  });
  return toOrderDTO(updated, await returnWindowDays());
}

/** Payment details to (re)open the card form for an unpaid order. */
export async function paymentSession(number: string, viewer: Viewer): Promise<PaymentSessionDTO> {
  const order = await findViewableOrder(number, viewer);
  const provider = getPaymentProvider();
  const intent = order.payments.find((p) => p.providerRef);
  if (!canPay(order) || !intent || !provider)
    throw AppError.conflict("This order is not awaiting payment");
  return {
    provider: provider.name,
    clientSecret: await provider.getClientSecret(intent.providerRef!),
    publishableKey: provider.publishableKey,
    amount: order.grandTotal,
    currency: order.currency,
  };
}
