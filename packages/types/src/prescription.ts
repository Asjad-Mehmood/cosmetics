import type { PrescriptionStatus } from "./enums";

export interface PrescriptionFileDTO {
  id: string;
  contentType: string;
  size: number;
}

/** A prescription as its customer sees it. */
export interface PrescriptionDTO {
  id: string;
  reference: string;
  status: PrescriptionStatus;
  name: string;
  phone: string;
  email: string | null;
  city: string;
  address: string | null;
  notes: string | null;
  allowSubstitutes: boolean;
  /** Message from the pharmacist. */
  pharmacistNote: string | null;
  orderNumber: string | null;
  fileCount: number;
  createdAt: string;
  updatedAt: string;
}

/** A prescription in the admin, with its files and internal notes. */
export interface AdminPrescriptionDTO extends PrescriptionDTO {
  userId: string | null;
  staffNotes: string | null;
  files: PrescriptionFileDTO[];
  reviewedBy: string | null;
  reviewedAt: string | null;
}

/** Limits for prescription uploads (shared by the form and the API). */
export const PRESCRIPTION_LIMITS = {
  maxFiles: 3,
  /** Per file, after the browser has resized photos. */
  maxFileBytes: 2 * 1024 * 1024,
  /** All files together (the request must stay under the host's 4.5 MB limit). */
  maxTotalBytes: 3 * 1024 * 1024,
  types: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
} as const;
