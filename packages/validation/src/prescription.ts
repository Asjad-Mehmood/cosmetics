import { PRESCRIPTION_LIMITS, PRESCRIPTION_STATUSES } from "@store/types";
import { z } from "zod";
import { emailSchema, paginationSchema, phoneSchema } from "./common";

/** Empty optional text fields arrive as "": treat them as not given. */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => v || undefined);

// Base64 grows bytes by 4/3; a little headroom for padding.
const MAX_BASE64 = Math.ceil((PRESCRIPTION_LIMITS.maxFileBytes * 4) / 3) + 16;

export const prescriptionSchema = z.object({
  name: z.string().trim().min(2, "Enter the patient's name").max(80),
  phone: phoneSchema,
  email: z
    .union([emailSchema, z.literal("")])
    .optional()
    .transform((v) => v || undefined),
  city: z.string().trim().min(2, "Enter your city").max(60),
  address: optionalText(300),
  notes: optionalText(1000),
  allowSubstitutes: z.boolean().default(true),
  /** The photos or PDFs, base64-encoded (without a data: prefix). */
  files: z
    .array(z.string().min(16).max(MAX_BASE64, "Each file must be 2 MB or smaller"))
    .min(1, "Add a photo of your prescription")
    .max(PRESCRIPTION_LIMITS.maxFiles, `Up to ${PRESCRIPTION_LIMITS.maxFiles} files`),
});
export type PrescriptionInput = z.input<typeof prescriptionSchema>;

export const prescriptionListQuerySchema = paginationSchema.extend({
  status: z.enum(PRESCRIPTION_STATUSES).optional(),
  q: z.string().trim().max(100).optional(),
});

export const updatePrescriptionSchema = z
  .object({
    status: z.enum(PRESCRIPTION_STATUSES).optional(),
    pharmacistNote: z.string().trim().max(1000).nullable().optional(),
    staffNotes: z.string().trim().max(2000).nullable().optional(),
    orderNumber: z.string().trim().max(30).nullable().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, "Nothing to update");
