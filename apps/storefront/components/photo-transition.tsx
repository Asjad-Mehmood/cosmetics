"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { reducedMotion } from "@/lib/motion";

const NAME = "product-photo";

/**
 * Product photo carry-over: when a product card is clicked, its photo grows
 * into the big photo on the product page instead of the page just switching.
 *
 * Uses the browser's View Transitions (Chrome, Edge, Safari 18+): the card's
 * photo is captured first, then the page changes, and the transition waits
 * (at most ~0.9 s) for the new page's photo. Browsers without View
 * Transitions, and visitors with Reduce motion, get the normal page switch.
 */
export function PhotoTransition() {
  const router = useRouter();
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (!("startViewTransition" in document) || reducedMotion()) return;
      const link = (e.target as Element | null)?.closest<HTMLAnchorElement>(
        'a[href^="/products/"]',
      );
      const photo = link?.querySelector<HTMLElement>("[data-card-photo]");
      if (!link || !photo || link.target === "_blank") return;
      const to = new URL(link.href);
      if (to.origin !== location.origin || to.pathname === location.pathname) return;
      // We start the navigation ourselves, after the old picture is taken.
      e.preventDefault();

      // The product page's own photo, if we are on one, must not share the name.
      const current = [...document.querySelectorAll<HTMLElement>("[data-pdp-photo]")];
      current.forEach((el) => (el.style.viewTransitionName = "none"));
      photo.style.viewTransitionName = NAME;

      const transition = document.startViewTransition(async () => {
        // The old picture is captured: hand the name over to the new page.
        photo.style.viewTransitionName = "";
        current.forEach((el) => (el.style.viewTransitionName = ""));
        router.push(to.pathname + to.search);
        await newPhotoOn(to.pathname, 900);
      });
      transition.finished.finally(() => {
        photo.style.viewTransitionName = "";
      });
    };
    // Capture: runs before <Link>, which then sees the click is handled.
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [router]);

  return null;
}

/** Resolves once the product page for `path` shows its photo, or after `ms`. */
function newPhotoOn(path: string, ms: number) {
  return new Promise<void>((resolve) => {
    const start = performance.now();
    const check = () => {
      const ready =
        location.pathname === path &&
        [...document.querySelectorAll<HTMLElement>("[data-pdp-photo]")].some(
          (el) => el.getBoundingClientRect().width > 0,
        );
      // A timer, not requestAnimationFrame: frames are paused during the transition.
      if (ready || performance.now() - start > ms) resolve();
      else setTimeout(check, 16);
    };
    check();
  });
}
