import type { Metadata } from "next";
import { siteConfig } from "./config";
import type { SearchParams } from "./listing";

/**
 * Open Graph fields every page shares. A page's own `openGraph` replaces the
 * layout's whole object, so pages spread this in rather than lose them.
 */
export const baseOpenGraph = {
  type: "website",
  siteName: siteConfig.name,
  locale: "en_PK",
} as const;

/** An absolute URL on this site. */
export const absoluteUrl = (path: string) =>
  path.startsWith("http") ? path : `${siteConfig.url}${path.startsWith("/") ? "" : "/"}${path}`;

/**
 * A page title without the store name: the root layout's title template adds
 * " | Amazon Group" itself, so a saved SEO title that already ends with it
 * would otherwise show the name twice.
 */
export function pageTitle(seoTitle: string | null | undefined, fallback: string): string {
  const name = siteConfig.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const cleaned = (seoTitle ?? "")
    .replace(new RegExp(`\\s*[|\\-–:]\\s*${name}\\s*$`, "i"), "")
    .trim();
  return cleaned || fallback;
}

/** A meta description: one line, at most ~155 characters, cut at a word. */
export function metaDescription(text: string | null | undefined, max = 155): string | undefined {
  const flat = (text ?? "").replace(/\s+/g, " ").trim();
  if (!flat) return undefined;
  if (flat.length <= max) return flat;
  const cut = flat.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,.;:–-]+$/, "")}…`;
}

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/**
 * Metadata for a product listing (shop, category, collection, offers).
 * Page 2 onwards gets its own canonical URL so its products stay reachable;
 * a filtered or re-sorted view is a near-copy of the plain listing, so it is
 * kept out of the index (its links are still followed).
 */
export function listingMetadata(
  path: string,
  sp: SearchParams,
): Pick<Metadata, "alternates" | "robots"> {
  const page = Math.max(1, Math.floor(Number(first(sp.page)) || 1));
  const filtered = Object.entries(sp).some(
    ([key, value]) => key !== "page" && value !== undefined && value !== "",
  );
  return {
    alternates: { canonical: page > 1 ? `${path}?page=${page}` : path },
    ...(filtered ? { robots: { index: false, follow: true } } : {}),
  };
}

export interface Crumb {
  label: string;
  href?: string;
}

/** schema.org BreadcrumbList, so results show "Home › Skincare › …" instead of a bare URL. */
export function breadcrumbJsonLd(items: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.label,
      ...(item.href ? { item: absoluteUrl(item.href) } : {}),
    })),
  };
}

/** The script tag's content: JSON with "<" escaped so it can't close the tag. */
export const jsonLdHtml = (data: unknown) => ({
  __html: JSON.stringify(data).replace(/</g, "\\u003c"),
});
