import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/config";

export const alt = `${siteConfig.name}: beauty and pharmacy store in Pakistan`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** The picture shown when the shop is shared on WhatsApp, Facebook, X… */
export default async function OpengraphImage() {
  const logo = await readFile(join(process.cwd(), "public/brand/logo.png"));
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 80,
        background: "#ffffff",
        borderBottom: "18px solid #f47b20",
        color: "#0f1d38",
        fontFamily: "sans-serif",
      }}
    >
      <img src={logoSrc} width={553} height={120} alt="" />
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ fontSize: 60, fontWeight: 700, lineHeight: 1.1 }}>
          Genuine beauty and health care, delivered across Pakistan.
        </div>
        <div style={{ fontSize: 34, color: "#c2410c" }}>
          Skincare · Makeup · Fragrance · Vitamins · Cash on Delivery
        </div>
      </div>
    </div>,
    size,
  );
}
