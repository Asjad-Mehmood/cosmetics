"use client";

import type Lenis from "lenis";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { loadGsap, lowPower } from "@/lib/gsap";

/*
 * Smooth, weighted scrolling with Lenis, run on GSAP's clock so every
 * ScrollTrigger scene (pinned map, sideways categories, parallax) moves in
 * step with it.
 *
 * Only for a mouse or trackpad on a capable device: touch screens keep their
 * native scrolling, and with Reduce motion GSAP (and so Lenis) never loads.
 * Lenis still uses the page's real scroll position, so the keyboard, find in
 * page, anchors and the scrollbar all work as normal.
 */
export function SmoothScroll() {
  const pathname = usePathname();
  const lenis = useRef<Lenis | null>(null);

  useEffect(() => {
    if (lowPower() || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const ready = loadGsap();
    if (!ready) return;
    let cancelled = false;
    let stop: (() => void) | undefined;
    void Promise.all([ready, import("lenis")]).then(([{ gsap, ScrollTrigger }, { default: L }]) => {
      if (cancelled) return;
      const l = new L({
        lerp: 0.12,
        // Scrollable areas inside the page (filters, menus) scroll on their own.
        allowNestedScroll: true,
        // Never scroll the page behind an open drawer or dialog.
        prevent: (node) => !!node.closest("dialog, [data-lenis-prevent]"),
      });
      l.on("scroll", ScrollTrigger.update);
      const tick = (time: number) => l.raf(time * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
      lenis.current = l;
      stop = () => {
        gsap.ticker.remove(tick);
        gsap.ticker.lagSmoothing(500, 33);
        l.destroy();
        lenis.current = null;
      };
    });
    return () => {
      cancelled = true;
      stop?.();
    };
  }, []);

  // A new page starts where Next.js puts it, without gliding from the old spot.
  useEffect(() => {
    lenis.current?.scrollTo(window.scrollY, { immediate: true, force: true });
  }, [pathname]);

  return null;
}
