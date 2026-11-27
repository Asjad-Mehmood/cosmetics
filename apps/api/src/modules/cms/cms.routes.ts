import type {
  BannerDTO,
  FaqDTO,
  FlashSaleSettingsDTO,
  HomeContentDTO,
  PageDTO,
} from "@store/types";
import { contactMessageSchema, newsletterSchema, stockAlertSchema } from "@store/validation";
import { ok } from "../../lib/http";
import { sendMail } from "../../lib/mailer";
import { prisma } from "../../lib/prisma";
import { storeInfo } from "../../lib/settings";
import { defineRoutes, route } from "../../lib/route";
import { AppError } from "../../utils/app-error";
import { newsletterWelcomeEmail } from "../engagement/emails";

async function getSetting<T>(key: string): Promise<T | undefined> {
  const row = await prisma.setting.findUnique({ where: { key } });
  return row?.value as T | undefined;
}

export const cmsRouter = defineRoutes("/cms", "Content", [
  route({
    method: "get",
    path: "/home",
    summary:
      "Site-wide content: announcement bar, active banners, contact details and delivery zones",
    description: "Banners are filtered by their active flag and optional start/end dates.",
    access: "public",
    handler: async () => {
      const now = new Date();
      const [banners, enabled, text, store, zones, coupons, sale, theme] = await Promise.all([
        prisma.banner.findMany({
          where: {
            isActive: true,
            AND: [
              { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
              { OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
            ],
          },
          orderBy: { position: "asc" },
        }),
        getSetting<boolean>("announcement.enabled"),
        getSetting<string>("announcement.text"),
        storeInfo(),
        prisma.shippingZone.findMany({ where: { isActive: true }, orderBy: { position: "asc" } }),
        prisma.coupon.findMany({
          where: {
            isActive: true,
            isPublic: true,
            AND: [
              { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
              { OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
            ],
          },
          orderBy: { createdAt: "asc" },
          take: 12,
        }),
        getSetting<FlashSaleSettingsDTO>("flashSale"),
        getSetting<string>("storefront.theme"),
      ]);
      const saleLive = !!(
        sale?.enabled &&
        sale.title &&
        sale.endsAt &&
        new Date(sale.endsAt) > now
      );
      return ok<HomeContentDTO>({
        announcement: enabled && text ? text : null,
        vouchers: coupons
          .filter((c) => c.maxUses === null || c.usedCount < c.maxUses)
          .map((c) => ({
            code: c.code,
            description: c.description,
            type: c.type,
            value: c.type === "FREE_SHIPPING" ? 0 : c.value,
            minOrderAmount: c.minOrderAmount,
            endsAt: c.endsAt?.toISOString() ?? null,
          })),
        banners: banners.map((b): BannerDTO => ({
          id: b.id,
          title: b.title,
          subtitle: b.subtitle,
          imageUrl: b.imageUrl,
          link: b.link,
          ctaLabel: b.ctaLabel,
        })),
        contact: { phone: store.phone || null, email: store.email || null },
        delivery: zones.map((z) => ({
          name: z.name,
          estimatedDays: z.estimatedDays,
          standardRate: z.standardRate,
          freeOverAmount: z.freeOverAmount,
          codFee: z.codEnabled ? z.codFee : 0,
        })),
        theme: theme === "minimal" ? "minimal" : "classic",
        flashSale: saleLive
          ? { title: sale!.title, subtitle: sale!.subtitle || null, endsAt: sale!.endsAt! }
          : null,
      });
    },
  }),
  route({
    method: "get",
    path: "/pages/:slug",
    summary: "A published content page (shipping, returns, privacy, terms…)",
    access: "public",
    handler: async ({ params }) => {
      const page = await prisma.page.findUnique({ where: { slug: params.slug! } });
      if (!page || !page.isPublished) throw AppError.notFound("Page");
      return ok<PageDTO>({
        slug: page.slug,
        title: page.title,
        content: page.content,
        seoDescription: page.seoDescription,
        updatedAt: page.updatedAt.toISOString(),
      });
    },
  }),
  route({
    method: "get",
    path: "/faq",
    summary: "Active FAQ entries in display order",
    access: "public",
    handler: async () =>
      ok<FaqDTO[]>(
        await prisma.faq.findMany({
          where: { isActive: true },
          orderBy: { position: "asc" },
          select: { id: true, question: true, answer: true, category: true },
        }),
      ),
  }),
]);

export const formsRouter = defineRoutes("", "Content", [
  route({
    method: "post",
    path: "/contact",
    summary: "Send a message to the store (appears in the admin inbox)",
    access: "public",
    rateLimit: "forms",
    body: contactMessageSchema,
    status: 201,
    handler: async ({ body }) => {
      const message = await prisma.contactMessage.create({ data: body, select: { id: true } });
      return ok(message);
    },
  }),
  route({
    method: "post",
    path: "/newsletter",
    summary: "Subscribe to the newsletter",
    description:
      "Always returns 204 (re-subscribes if previously unsubscribed), so it never reveals who is subscribed. New subscribers get a welcome email with an unsubscribe link.",
    access: "public",
    rateLimit: "forms",
    body: newsletterSchema,
    handler: async ({ body }) => {
      const before = await prisma.newsletterSubscriber.findUnique({ where: { email: body.email } });
      await prisma.newsletterSubscriber.upsert({
        where: { email: body.email },
        create: { email: body.email },
        update: { unsubscribedAt: null },
      });
      if (!before || before.unsubscribedAt) void sendMail(newsletterWelcomeEmail(body.email));
    },
  }),
  route({
    method: "post",
    path: "/stock-alerts",
    summary: "Ask to be emailed when a sold-out variant is back in stock",
    description: "Idempotent. Emails are sent when stock is added (Phase 5).",
    access: "public",
    rateLimit: "forms",
    body: stockAlertSchema,
    handler: async ({ body }) => {
      const variant = await prisma.productVariant.findUnique({
        where: { id: body.variantId },
        select: { isActive: true, product: { select: { status: true } } },
      });
      if (!variant || !variant.isActive || variant.product.status !== "ACTIVE") {
        throw AppError.notFound("Product");
      }
      await prisma.stockAlert.upsert({
        where: { email_variantId: { email: body.email, variantId: body.variantId } },
        create: body,
        update: { notifiedAt: null },
      });
    },
  }),
]);
