"use client";

import { useEffect } from "react";

/**
 * Puts the shop design on <html data-store-theme> (so dialogs and drawers,
 * which render outside the page, get its colours too) and takes it off again
 * when leaving the shop, e.g. for the admin panel.
 */
export function ThemeAttr({ theme }: { theme: string }) {
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.storeTheme = theme;
    return () => {
      delete root.dataset.storeTheme;
    };
  }, [theme]);
  return null;
}
