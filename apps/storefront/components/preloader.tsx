"use client";

import { useEffect } from "react";
import { loadGsap } from "@/lib/gsap";
import { markShown } from "@/lib/preloader";

/** Longest the preloader waits (slow connections still see the shop quickly). */
const MAX_MS = 5000;
/** Shortest time on screen, so a fast load doesn't flash it. */
const MIN_MS = 450;

/**
 * Lifts the preloader once everything the first screen needs is ready: GSAP
 * and its plugins, every scroll scene set up, the fonts, and the photos that
 * are on screen. Mounted last in the shop layout, so every other effect
 * (scroll scenes, the delivery map, the hero) has run before it.
 */
export function Preloader() {
  useEffect(() => {
    const html = document.documentElement;
    if (!html.hasAttribute("data-preload")) {
      markShown();
      return;
    }
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      html.setAttribute("data-preload-out", "");
      html.removeAttribute("data-preload");
      markShown();
      setTimeout(() => html.removeAttribute("data-preload-out"), 800);
    };
    const cap = setTimeout(finish, Math.max(0, MAX_MS - performance.now()));
    const wait = (ms: number) => new Promise((r) => setTimeout(r, Math.max(0, ms)));
    const photos = [...document.querySelectorAll<HTMLImageElement>("#main img")]
      .filter((img) => !img.complete && img.getBoundingClientRect().top < window.innerHeight)
      .map(
        (img) =>
          new Promise((r) => {
            img.addEventListener("load", r, { once: true });
            img.addEventListener("error", r, { once: true });
          }),
      );
    void Promise.all([
      loadGsap(),
      document.fonts?.ready,
      wait(MIN_MS - performance.now()),
      ...photos,
    ])
      // Two frames: let the scroll scenes measure the page first.
      .then(() => requestAnimationFrame(() => requestAnimationFrame(finish)));
    return () => clearTimeout(cap);
  }, []);
  return null;
}
