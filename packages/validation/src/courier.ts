import { z } from "zod";

const text = (max: number) => z.string().trim().max(max);

/**
 * Saving the TCS settings in the admin. Only operational details: the TCS API
 * login is set in the server's environment variables, not here.
 */
export const tcsSettingsSchema = z.object({
  enabled: z.boolean(),
  serviceCode: text(6).min(1, "Enter the TCS service code, e.g. O"),
  shipperName: text(50),
  shipperAddress: text(120),
  shipperCity: text(50),
  shipperMobile: z
    .string()
    .trim()
    .transform((v) => v.replace(/[\s-]/g, "").replace(/^\+92/, "0"))
    .pipe(z.string().regex(/^(0\d{10})?$/, "Use an 11-digit mobile number like 03001234567")),
  defaultWeightKg: z.number().min(0.5, "TCS's minimum weight is 0.5 kg").max(100),
});
export type TcsSettingsInput = z.infer<typeof tcsSettingsSchema>;

/** Booking an order with TCS from the admin. */
export const tcsBookingSchema = z.object({
  cityName: z.string().trim().min(2, "Choose the TCS destination city").max(50),
  cityCode: z.string().trim().max(5).optional(),
  weightKg: z.number().min(0.5, "TCS's minimum weight is 0.5 kg").max(100),
  pieces: z.number().int().min(1).max(50),
  fragile: z.boolean().default(false),
  remarks: z.string().trim().max(200).optional(),
});
export type TcsBookingInput = z.infer<typeof tcsBookingSchema>;
