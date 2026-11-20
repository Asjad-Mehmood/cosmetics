"use client";

import { ChevronDownIcon } from "../icons";

/** Full-width "Back to top" bar above the footer. */
export function BackToTop() {
  return (
    <button
      type="button"
      onClick={() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
        document.querySelector<HTMLElement>("#main")?.focus({ preventScroll: true });
      }}
      className="bg-surface hover:bg-brand-50 text-brand-700 flex w-full items-center justify-center gap-2 py-3.5 text-sm font-semibold transition"
    >
      <ChevronDownIcon className="rotate-180" /> Back to top
    </button>
  );
}
