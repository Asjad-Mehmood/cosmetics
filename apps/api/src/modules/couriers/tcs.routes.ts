import { tcsBookingSchema, tcsSettingsSchema } from "@store/validation";
import { audit } from "../../lib/audit";
import { ok } from "../../lib/http";
import { defineRoutes, route } from "../../lib/route";
import { currentUser } from "../../middleware/auth";
import { AppError } from "../../utils/app-error";
import { getAdminOrder } from "../orders/admin-orders.service";
import { prisma } from "../../lib/prisma";
import { tcsTestLogin } from "./tcs.client";
import {
  bookingDraft,
  bookWithTcs,
  cancelTcsBooking,
  syncTcsTracking,
  tcsCityList,
  tcsLabelPdf,
} from "./tcs.service";
import { loadTcsConfig, saveTcsSettings, tcsSettingsDTO } from "./tcs.settings";

/** Store settings → TCS courier (Super Admin: holds the TCS login). */
export const adminTcsSettingsRouter = defineRoutes("/admin/couriers/tcs", "Admin: Couriers", [
  route({
    method: "get",
    path: "",
    summary: "TCS courier settings (secrets are never returned)",
    access: "SUPER_ADMIN",
    handler: async () => ok(await tcsSettingsDTO()),
  }),
  route({
    method: "put",
    path: "",
    summary: "Save the TCS courier settings",
    description:
      "Leave clientSecret or password out to keep the stored one. Secrets are stored encrypted.",
    access: "SUPER_ADMIN",
    body: tcsSettingsSchema,
    handler: async ({ req, body }) => {
      const changed = await saveTcsSettings(body);
      await audit(req, "settings.tcs", "Setting", "tcs", { keys: changed });
      // The city list may differ between sandbox and production.
      await prisma.setting.deleteMany({ where: { key: "tcs.cities" } });
      return ok(await tcsSettingsDTO());
    },
  }),
  route({
    method: "post",
    path: "/test",
    summary: "Check the saved TCS login works",
    access: "SUPER_ADMIN",
    handler: async () => {
      const config = await loadTcsConfig();
      if (!config.credentials) {
        throw AppError.badRequest(
          "Enter and save the TCS client ID, secret, username and password first.",
        );
      }
      try {
        await tcsTestLogin(config.credentials);
      } catch (err) {
        throw AppError.badRequest((err as Error).message);
      }
      const cities = await tcsCityList().catch(() => []);
      return ok({ ok: true, environment: config.environment, cities: cities.length });
    },
  }),
  route({
    method: "get",
    path: "/cities",
    summary: "TCS's cities (cached for a week)",
    access: "SUPPORT",
    handler: async () => ok(await tcsCityList()),
  }),
]);

/** Booking, labels and tracking for one order. */
export const adminOrderTcsRouter = defineRoutes("/admin/orders", "Admin: Couriers", [
  route({
    method: "get",
    path: "/:number/tcs",
    summary: "What booking this order with TCS would send (city, weight, cash to collect)",
    access: "SUPPORT",
    handler: async ({ params }) => ok(await bookingDraft(params.number!)),
  }),
  route({
    method: "post",
    path: "/:number/tcs",
    summary: "Book the order with TCS: saves the consignment number and marks it packed",
    access: "SUPPORT",
    body: tcsBookingSchema,
    handler: async ({ req, params, body }) => {
      const cn = await bookWithTcs(params.number!, body, currentUser(req).id);
      const order = await getAdminOrder(params.number!);
      await audit(req, "order.tcs-book", "Order", order.id, { number: order.number, cn });
      return ok(order);
    },
  }),
  route({
    method: "delete",
    path: "/:number/tcs",
    summary: "Cancel the TCS booking (before TCS collects the parcel)",
    access: "SUPPORT",
    handler: async ({ req, params }) => {
      await cancelTcsBooking(params.number!, currentUser(req).id);
      const order = await getAdminOrder(params.number!);
      await audit(req, "order.tcs-cancel", "Order", order.id, { number: order.number });
      return ok(order);
    },
  }),
  route({
    method: "get",
    path: "/:number/tcs/label",
    summary: "The TCS airway bill (PDF) to stick on the parcel",
    access: "SUPPORT",
    handler: async ({ params, res }) => {
      const { pdf, cn } = await tcsLabelPdf(params.number!);
      res
        .status(200)
        .type("application/pdf")
        .set("Content-Disposition", `inline; filename="TCS-${cn}.pdf"`)
        .send(pdf);
    },
  }),
  route({
    method: "post",
    path: "/:number/tcs/sync",
    summary: "Fetch the latest TCS tracking now and update the order",
    access: "SUPPORT",
    handler: async ({ params }) => {
      const order = await getAdminOrder(params.number!);
      await syncTcsTracking(order.id, { force: true });
      return ok(await getAdminOrder(params.number!));
    },
  }),
]);
