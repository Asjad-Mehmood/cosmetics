import {
  type AdminPrescriptionDTO,
  PRESCRIPTION_LIMITS,
  PRESCRIPTION_STATUS_LABELS,
  type PrescriptionDTO,
} from "@store/types";
import {
  prescriptionListQuerySchema,
  prescriptionSchema,
  updatePrescriptionSchema,
} from "@store/validation";
import type { Prisma, Prescription, PrescriptionFile } from "@prisma/client";
import { randomInt } from "node:crypto";
import { env } from "../../config/env";
import { audit } from "../../lib/audit";
import { emailLayout, esc } from "../../lib/email-layout";
import { ok, paginated, skipTake } from "../../lib/http";
import { sendMail } from "../../lib/mailer";
import { prisma } from "../../lib/prisma";
import { defineRoutes, route } from "../../lib/route";
import { storeInfo } from "../../lib/settings";
import { AppError } from "../../utils/app-error";
import { sniffImage } from "../admin/uploads.routes";

/*
 * Prescriptions: a customer uploads a photo or PDF of their prescription, the
 * pharmacist checks it, calls them to agree the medicines and price, and the
 * order is delivered (cash on delivery).
 *
 * This is medical data. The files are never public: only staff can open them
 * (with no caching), customers see their own requests without the files, and
 * a manager can delete a prescription and its files for good.
 */

type WithFiles = Prescription & { files: Pick<PrescriptionFile, "id" | "contentType" | "size">[] };

const fileSelect = { select: { id: true, contentType: true, size: true } } as const;

const toDTO = (p: WithFiles): PrescriptionDTO => ({
  id: p.id,
  reference: p.reference,
  status: p.status,
  name: p.name,
  phone: p.phone,
  email: p.email,
  city: p.city,
  address: p.address,
  notes: p.notes,
  allowSubstitutes: p.allowSubstitutes,
  pharmacistNote: p.pharmacistNote,
  orderNumber: p.orderNumber,
  fileCount: p.files.length,
  createdAt: p.createdAt.toISOString(),
  updatedAt: p.updatedAt.toISOString(),
});

const toAdminDTO = (p: WithFiles & { reviewer?: string | null }): AdminPrescriptionDTO => ({
  ...toDTO(p),
  userId: p.userId,
  staffNotes: p.staffNotes,
  files: p.files,
  reviewedBy: p.reviewer ?? null,
  reviewedAt: p.reviewedAt?.toISOString() ?? null,
});

/** The file's real type, from its first bytes (the browser's word is not trusted). */
export function sniffPrescriptionFile(buf: Buffer): string | null {
  if (buf.subarray(0, 5).toString("ascii") === "%PDF-") return "application/pdf";
  const image = sniffImage(buf);
  if (image === "jpg") return "image/jpeg";
  if (image === "png") return "image/png";
  if (image === "webp") return "image/webp";
  return null;
}

// No 0/O or 1/I, so the reference is easy to read out over the phone.
const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const newReference = () =>
  `RX-${Array.from({ length: 6 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("")}`;

function decodeFiles(files: string[]) {
  const decoded = files.map((b64, i) => {
    const bytes = Buffer.from(b64, "base64");
    const type = sniffPrescriptionFile(bytes);
    if (!type) {
      throw AppError.badRequest(
        `File ${i + 1}: only photos (JPEG, PNG, WebP) and PDFs are accepted`,
      );
    }
    if (bytes.length > PRESCRIPTION_LIMITS.maxFileBytes) {
      throw AppError.badRequest(`File ${i + 1} is larger than 2 MB`);
    }
    return { contentType: type, bytes: new Uint8Array(bytes), size: bytes.length };
  });
  const total = decoded.reduce((sum, f) => sum + f.size, 0);
  if (total > PRESCRIPTION_LIMITS.maxTotalBytes) {
    throw AppError.badRequest("The files are larger than 3 MB together");
  }
  return decoded;
}

async function notifyCustomer(p: Prescription) {
  if (!p.email) return;
  const store = await storeInfo();
  const link = env.STOREFRONT_URL ? `${env.STOREFRONT_URL}/account/prescriptions` : undefined;
  const status = PRESCRIPTION_STATUS_LABELS[p.status];
  const lines: Record<Prescription["status"], string> = {
    PENDING: `We have received your prescription (${p.reference}). Our pharmacist will check it and call you on ${p.phone} to confirm your medicines and the price.`,
    IN_REVIEW: `Our pharmacist is checking your prescription (${p.reference}) and will call you on ${p.phone} soon.`,
    CONFIRMED: `Your prescription (${p.reference}) has been confirmed${p.orderNumber ? ` and order ${p.orderNumber} is being prepared` : ""}. You pay in cash when it arrives.`,
    REJECTED: `Unfortunately we could not accept your prescription (${p.reference}).`,
    COMPLETED: `Your medicines for prescription ${p.reference} have been delivered. Get well soon!`,
  };
  const subject = `Prescription ${p.reference}: ${status}`;
  const note = p.pharmacistNote ? `\n\nFrom our pharmacist: ${p.pharmacistNote}` : "";
  await sendMail({
    to: p.email,
    subject,
    text: `Hi ${p.name},\n\n${lines[p.status]}${note}\n\n${store.name}${link ? `\n${link}` : ""}\n`,
    html: emailLayout(
      subject,
      `<p>Hi ${esc(p.name)},</p><p>${esc(lines[p.status])}</p>${
        p.pharmacistNote
          ? `<p style="padding:12px;border-radius:8px;background:#f6f6f7;white-space:pre-line"><strong>From our pharmacist:</strong><br>${esc(p.pharmacistNote)}</p>`
          : ""
      }<p>${esc(store.name)}</p>`,
      link ? { label: "See your prescriptions", url: link } : undefined,
    ),
  });
}

/** Customers: upload a prescription, and see their own. */
export const prescriptionsRouter = defineRoutes("/prescriptions", "Prescriptions", [
  route({
    method: "post",
    path: "",
    summary: "Upload a prescription for the pharmacist to check",
    description:
      "Guests and signed-in customers. Photos (JPEG, PNG, WebP) or PDFs, base64-encoded, up to 3 files, 2 MB each and 3 MB together; the type is checked from the file's bytes. Returns the reference the customer quotes when the pharmacist calls.",
    access: "optional",
    rateLimit: "forms",
    body: prescriptionSchema,
    status: 201,
    handler: async ({ req, body }) => {
      const files = decodeFiles(body.files);
      const { files: _files, ...details } = body;
      let created: WithFiles | null = null;
      for (let attempt = 0; !created; attempt++) {
        try {
          created = await prisma.prescription.create({
            data: {
              ...details,
              reference: newReference(),
              userId: req.user?.id ?? null,
              files: { create: files },
            },
            include: { files: fileSelect },
          });
        } catch (err) {
          // A clash on the random reference: try another (practically never happens).
          const clash = (err as { code?: string }).code === "P2002";
          if (!clash || attempt >= 4) throw err;
        }
      }
      void notifyCustomer(created).catch(() => undefined);
      return ok(toDTO(created));
    },
  }),
  route({
    method: "get",
    path: "",
    summary: "The signed-in customer's prescriptions, newest first",
    access: "user",
    handler: async ({ req }) => {
      const rows = await prisma.prescription.findMany({
        where: { userId: req.user!.id },
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { files: fileSelect },
      });
      return ok(rows.map(toDTO));
    },
  }),
]);

async function findPrescription(id: string) {
  const p = await prisma.prescription.findUnique({ where: { id }, include: { files: fileSelect } });
  if (!p) throw AppError.notFound("Prescription");
  return p;
}

async function withReviewers(rows: WithFiles[]) {
  const ids = [...new Set(rows.map((r) => r.reviewedById).filter((id): id is string => !!id))];
  const staff = ids.length
    ? await prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } })
    : [];
  const names = new Map(staff.map((s) => [s.id, s.name]));
  return rows.map((r) =>
    toAdminDTO({ ...r, reviewer: r.reviewedById ? names.get(r.reviewedById) : null }),
  );
}

/** Staff: the pharmacist's queue. */
export const adminPrescriptionsRouter = defineRoutes(
  "/admin/prescriptions",
  "Admin: Prescriptions",
  [
    route({
      method: "get",
      path: "",
      summary: "Prescriptions, oldest waiting first (or newest first for one status)",
      access: "SUPPORT",
      query: prescriptionListQuerySchema,
      handler: async ({ query }) => {
        const open = ["PENDING", "IN_REVIEW"] as const;
        const where: Prisma.PrescriptionWhereInput = {
          ...(query.status ? { status: query.status } : {}),
          ...(query.q
            ? {
                OR: [
                  { reference: { contains: query.q, mode: "insensitive" } },
                  { name: { contains: query.q, mode: "insensitive" } },
                  { phone: { contains: query.q.replace(/[\s-]/g, "") } },
                  { email: { contains: query.q, mode: "insensitive" } },
                  { city: { contains: query.q, mode: "insensitive" } },
                ],
              }
            : {}),
        };
        // The queue: anything still waiting comes first, oldest first.
        const queue = !query.status || (open as readonly string[]).includes(query.status);
        const [rows, total] = await Promise.all([
          prisma.prescription.findMany({
            where,
            orderBy: queue ? [{ status: "asc" }, { createdAt: "asc" }] : { createdAt: "desc" },
            include: { files: fileSelect },
            ...skipTake(query),
          }),
          prisma.prescription.count({ where }),
        ]);
        return paginated(await withReviewers(rows), {
          page: query.page,
          limit: query.limit,
          total,
        });
      },
    }),
    route({
      method: "get",
      path: "/:id/files/:fileId",
      summary: "Open a prescription's photo or PDF (staff only, never cached)",
      access: "SUPPORT",
      handler: async ({ req, params, res }) => {
        const file = await prisma.prescriptionFile.findFirst({
          where: { id: params.fileId!, prescriptionId: params.id! },
          select: { bytes: true, contentType: true },
        });
        if (!file) throw AppError.notFound("File");
        await audit(req, "prescription.view-file", "Prescription", params.id!, {
          fileId: params.fileId!,
        });
        res
          .status(200)
          .set({
            "Content-Type": file.contentType,
            "Cache-Control": "private, no-store",
            "Content-Disposition": "inline",
            "Content-Security-Policy": "default-src 'none'; sandbox",
            "X-Content-Type-Options": "nosniff",
          })
          .send(Buffer.from(file.bytes));
      },
    }),
    route({
      method: "patch",
      path: "/:id",
      summary: "Update a prescription's status, notes or order number",
      description:
        "The customer is emailed (when they gave an email) whenever the status changes; `pharmacistNote` is included in that email and shown in their account.",
      access: "SUPPORT",
      body: updatePrescriptionSchema,
      handler: async ({ req, params, body }) => {
        const before = await findPrescription(params.id!);
        const statusChanged = body.status !== undefined && body.status !== before.status;
        const updated = await prisma.prescription.update({
          where: { id: before.id },
          data: {
            ...body,
            ...(statusChanged ? { reviewedById: req.user!.id, reviewedAt: new Date() } : {}),
          },
          include: { files: fileSelect },
        });
        await audit(req, "prescription.update", "Prescription", before.id, {
          ...body,
          ...(statusChanged ? { from: before.status } : {}),
        } as Prisma.InputJsonValue);
        if (statusChanged) void notifyCustomer(updated).catch(() => undefined);
        return ok((await withReviewers([updated]))[0]);
      },
    }),
    route({
      method: "delete",
      path: "/:id",
      summary: "Delete a prescription and its files for good (privacy requests)",
      access: "MANAGER",
      handler: async ({ req, params }) => {
        const p = await findPrescription(params.id!);
        await prisma.prescription.delete({ where: { id: p.id } });
        await audit(req, "prescription.delete", "Prescription", p.id, { reference: p.reference });
      },
    }),
  ],
);
