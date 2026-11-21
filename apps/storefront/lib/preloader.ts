"use client";

/*
 * The preloader (components/preloader.tsx) covers the shop until GSAP, the
 * fonts and the photos on the first screen are ready. Effects that should
 * play when the page is revealed wait for `whenShown()`.
 */
let markShownFn: (() => void) | undefined;
const shown =
  typeof window === "undefined"
    ? Promise.resolve()
    : new Promise<void>((resolve) => {
        markShownFn = resolve;
      });

/** Is the preloader still covering the page? */
export function preloading(): boolean {
  return typeof document !== "undefined" && document.documentElement.hasAttribute("data-preload");
}

/** Resolves as the page is revealed (straight away if there is no preloader). */
export function whenShown(): Promise<void> {
  return preloading() ? shown : Promise.resolve();
}

export function markShown() {
  markShownFn?.();
}

/**
 * Runs before the page is first painted (inline, in the HTML): turns the
 * preloader on, unless the visitor asked for reduced motion. If the app never
 * starts (a script error), it lifts itself after 6 seconds.
 */
export const PRELOAD_SCRIPT = `(function(){try{if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;var d=document.documentElement;d.setAttribute("data-preload","");setTimeout(function(){d.removeAttribute("data-preload")},6000)}catch(e){}})()`;
