import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/config";

export const alt = `${siteConfig.name}: beauty and pharmacy store in Pakistan`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** The picture shown when the shop is shared on WhatsApp, Facebook, X… */
export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 80,
        background: "#0f5e63",
        color: "white",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
        <svg width="120" height="120" viewBox="0 0 32 32">
          <rect width="32" height="32" rx="8" fill="#ffffff" />
          <path
            d="M16 4.5S7.5 13.4 7.5 19.3a8.5 8.5 0 0 0 17 0C24.5 13.4 16 4.5 16 4.5Z"
            fill="#0f5e63"
          />
          <path
            d="M16 15.3v7.6M12.2 19.1h7.6"
            stroke="#f3a3b0"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        </svg>
        <div style={{ fontSize: 72, fontWeight: 800, letterSpacing: -2 }}>{siteConfig.name}</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ fontSize: 60, fontWeight: 700, lineHeight: 1.1 }}>
          Genuine beauty and health care, delivered across Pakistan.
        </div>
        <div style={{ fontSize: 34, color: "#f3a3b0" }}>
          Skincare · Makeup · Fragrance · Vitamins · Cash on Delivery
        </div>
      </div>
    </div>,
    size,
  );
}
