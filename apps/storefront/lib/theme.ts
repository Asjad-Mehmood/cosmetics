import type { HomeContentDTO } from "@store/types";
import { cookies, draftMode } from "next/headers";

export type StoreTheme = HomeContentDTO["theme"];

/** Cookie that holds the design being previewed (set by /theme-preview). */
export const THEME_PREVIEW_COOKIE = "store_theme_preview";

export const isStoreTheme = (v: unknown): v is StoreTheme => v === "classic" || v === "minimal";

/**
 * The design to show: the one chosen in the admin, unless this browser is
 * previewing another one. Previews use Next.js draft mode, so normal visitors
 * keep getting the cached pages and only the previewing browser renders fresh.
 */
export async function resolveTheme(home: HomeContentDTO | null): Promise<{
  theme: StoreTheme;
  preview: boolean;
}> {
  const live: StoreTheme = isStoreTheme(home?.theme) ? home.theme : "classic";
  if ((await draftMode()).isEnabled) {
    const wanted = (await cookies()).get(THEME_PREVIEW_COOKIE)?.value;
    if (isStoreTheme(wanted)) return { theme: wanted, preview: true };
  }
  return { theme: live, preview: false };
}

/** Sets <html data-store-theme> before the first paint, so the page never flashes the other design. */
export const themeScript = (theme: StoreTheme) =>
  `document.documentElement.dataset.storeTheme=${JSON.stringify(theme)}`;
