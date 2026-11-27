import localFont from "next/font/local";

/** Plus Jakarta Sans, self-hosted (variable weight, Latin), exposed as --font-brand. */
export const brandFont = localFont({
  src: "../node_modules/@fontsource-variable/plus-jakarta-sans/files/plus-jakarta-sans-latin-wght-normal.woff2",
  weight: "200 800",
  style: "normal",
  display: "swap",
  variable: "--font-brand",
});

/**
 * Instrument Sans, for the minimal shop design. Not preloaded: the classic
 * design never uses it, so only the minimal one downloads it.
 */
export const minimalFont = localFont({
  src: "../node_modules/@fontsource-variable/instrument-sans/files/instrument-sans-latin-wght-normal.woff2",
  weight: "400 700",
  style: "normal",
  display: "swap",
  variable: "--font-minimal",
  preload: false,
});
