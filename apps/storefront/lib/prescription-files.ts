import { PRESCRIPTION_LIMITS } from "@store/types";

export interface PreparedFile {
  id: string;
  name: string;
  /** What is uploaded: a resized JPEG for photos, the file itself for PDFs. */
  blob: Blob;
  kind: "image" | "pdf";
  /** Object URL for the thumbnail (photos only). */
  preview?: string;
}

const MAX_SIDE = 2000;

/**
 * Photos are resized to at most 2000 px and re-saved as JPEG in the browser:
 * small enough to upload on mobile data, still sharp enough to read, and the
 * re-save drops the photo's hidden details (such as where it was taken).
 */
async function shrinkPhoto(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  for (const quality of [0.85, 0.72, 0.6]) {
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", quality));
    if (blob && blob.size <= PRESCRIPTION_LIMITS.maxFileBytes) return blob;
  }
  throw new Error(`${file.name} is too large even after resizing. Try a closer photo.`);
}

export async function prepareFile(file: File): Promise<PreparedFile> {
  const id = `${file.name}-${file.size}-${file.lastModified}`;
  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
    if (file.size > PRESCRIPTION_LIMITS.maxFileBytes) {
      throw new Error(`${file.name} is larger than 2 MB. Send a photo of it instead.`);
    }
    return { id, name: file.name, blob: file, kind: "pdf" };
  }
  if (!file.type.startsWith("image/")) {
    throw new Error(`${file.name} isn't a photo or a PDF.`);
  }
  let blob: Blob;
  try {
    blob = await shrinkPhoto(file);
  } catch (err) {
    if (err instanceof Error && err.message.includes("too large")) throw err;
    throw new Error(`${file.name} couldn't be opened. Try a JPEG or PNG photo.`);
  }
  return { id, name: file.name, blob, kind: "image", preview: URL.createObjectURL(blob) };
}

/** The file as base64, without the "data:...;base64," prefix. */
export function toBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
