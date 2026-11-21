"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { loadGsap } from "@/lib/gsap";

type Lib = NonNullable<Awaited<ReturnType<typeof loadGsap>>>;

/*
 * Scroll scenes, driven by GSAP + ScrollTrigger and switched on with data
 * attributes, so server-rendered pages can use them without becoming client
 * components:
 *
 *   data-gsap="split"     heading: its words rise out of a mask as it scrolls in
 *   data-gsap="reveal"    block: fades and rises into place
 *   data-gsap="stagger"   group: its `.reveal-item` children (or children) come in one by one
 *   data-gsap="zoom"      panel: grows from 92% to full size as it scrolls into view (scrubbed)
 *   data-gsap="parallax"  frame: the photo inside moves slower than the page (scrubbed)
 *   data-gsap="tilt"      card: tilts in 3D towards the pointer
 *   data-gsap="magnetic"  button: is pulled a little towards the pointer
 *
 * Rules: anything already on screen when the page loads is left alone (no
 * delay to the first paint); nothing is hidden before GSAP has loaded; with
 * Reduce motion GSAP never loads, so everything is simply shown.
 */
export function GsapScenes() {
  const pathname = usePathname();

  useEffect(() => {
    const ready = loadGsap();
    if (!ready) return;
    let cancelled = false;
    let observer: MutationObserver | undefined;
    let cleanup: (() => void) | undefined;

    void ready.then((lib) => {
      if (cancelled) return;
      const ctx = lib.gsap.context(() => {});
      const pointerFine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
      let timer: ReturnType<typeof setTimeout> | undefined;
      const scan = () => {
        ctx.add(() => setup(lib, pointerFine));
        lib.ScrollTrigger.refresh();
      };
      scan();
      // Content that arrives later ("load more", client-rendered rails) gets scenes too.
      observer = new MutationObserver(() => {
        clearTimeout(timer);
        timer = setTimeout(scan, 200);
      });
      const main = document.getElementById("main");
      if (main) observer.observe(main, { childList: true, subtree: true });
      cleanup = () => {
        clearTimeout(timer);
        ctx.revert();
        document
          .querySelectorAll("[data-gsap-on]")
          .forEach((el) => el.removeAttribute("data-gsap-on"));
      };
    });

    return () => {
      cancelled = true;
      observer?.disconnect();
      cleanup?.();
    };
  }, [pathname]);

  return null;
}

/** Below the fold right now? (Only those are hidden and animated in.) */
const belowFold = (el: Element) => el.getBoundingClientRect().top > window.innerHeight * 0.95;

/** Each element is set up once (marked), however often the page is scanned. */
function fresh(selector: string) {
  return [...document.querySelectorAll<HTMLElement>(`${selector}:not([data-gsap-on])`)].map(
    (el) => {
      el.setAttribute("data-gsap-on", "");
      return el;
    },
  );
}

function setup({ gsap, ScrollTrigger, SplitText }: Lib, pointerFine: boolean) {
  // Pointer listeners to remove when the page changes (GSAP reverts the rest).
  const offs: (() => void)[] = [];
  const on = (
    el: HTMLElement,
    type: "pointermove" | "pointerleave",
    fn: (e: PointerEvent) => void,
  ) => {
    el.addEventListener(type, fn);
    offs.push(() => el.removeEventListener(type, fn));
  };

  // Headings: words rise out of a mask, line by line.
  for (const el of fresh('[data-gsap="split"]')) {
    if (!belowFold(el)) continue;
    SplitText.create(el, {
      type: "words,lines",
      mask: "lines",
      autoSplit: true,
      onSplit: (self) =>
        gsap.from(self.words, {
          yPercent: 115,
          rotate: 4,
          duration: 1,
          stagger: 0.045,
          scrollTrigger: { trigger: el, start: "top 88%", once: true },
        }),
    });
  }

  // Blocks: rise and fade in.
  for (const el of fresh('[data-gsap="reveal"]')) {
    if (!belowFold(el)) continue;
    gsap.from(el, {
      y: 70,
      opacity: 0,
      scale: 0.98,
      duration: 1.1,
      scrollTrigger: { trigger: el, start: "top 90%", once: true },
    });
  }

  // Hidden with opacity only (not visibility), so keyboard users can still tab
  // to them; focusing one scrolls it into view, which plays its entrance.

  // Groups: children come in one after another, in batches as they scroll in.
  for (const group of fresh('[data-gsap="stagger"]')) {
    const marked = group.querySelectorAll<HTMLElement>(".reveal-item");
    const items = [...(marked.length ? marked : group.children)].filter(belowFold);
    if (!items.length) continue;
    gsap.set(items, { opacity: 0, y: 60, rotate: 1.5 });
    ScrollTrigger.batch(items, {
      start: "top 92%",
      once: true,
      onEnter: (batch) =>
        gsap.to(batch, {
          opacity: 1,
          y: 0,
          rotate: 0,
          duration: 0.95,
          stagger: { each: 0.08, from: "start" },
          overwrite: true,
          clearProps: "transform",
        }),
    });
  }

  // Panels: grow into place as they come up the screen (tied to the scroll).
  for (const el of fresh('[data-gsap="zoom"]')) {
    gsap.fromTo(
      el,
      { scale: 0.92, borderRadius: "3rem" },
      {
        scale: 1,
        borderRadius: "1.5rem",
        ease: "none",
        scrollTrigger: { trigger: el, start: "top bottom", end: "top 55%", scrub: 0.6 },
      },
    );
  }

  // Photos that move slower than the page.
  for (const frame of fresh('[data-gsap="parallax"]')) {
    const img = frame.querySelector("img");
    if (!img) continue;
    gsap.fromTo(
      img,
      { yPercent: -9, scale: 1.18 },
      {
        yPercent: 9,
        scale: 1.18,
        ease: "none",
        scrollTrigger: { trigger: frame, start: "top bottom", end: "bottom top", scrub: true },
      },
    );
  }

  if (!pointerFine) return () => offs.forEach((off) => off());

  // Cards that tilt towards the pointer.
  for (const el of fresh('[data-gsap="tilt"]')) {
    gsap.set(el, { transformPerspective: 700 });
    const rx = gsap.quickTo(el, "rotationX", { duration: 0.5, ease: "power3" });
    const ry = gsap.quickTo(el, "rotationY", { duration: 0.5, ease: "power3" });
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      ry(((e.clientX - r.left) / r.width - 0.5) * 14);
      rx(-((e.clientY - r.top) / r.height - 0.5) * 14);
    };
    const leave = () => {
      rx(0);
      ry(0);
    };
    on(el, "pointermove", move);
    on(el, "pointerleave", leave);
  }

  // Buttons pulled towards the pointer, springing back when it leaves.
  for (const el of fresh('[data-gsap="magnetic"]')) {
    const x = gsap.quickTo(el, "x", { duration: 0.4, ease: "power3" });
    const y = gsap.quickTo(el, "y", { duration: 0.4, ease: "power3" });
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      x((e.clientX - (r.left + r.width / 2)) * 0.3);
      y((e.clientY - (r.top + r.height / 2)) * 0.4);
    };
    const leave = () =>
      gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: "elastic.out(1, 0.4)", overwrite: true });
    on(el, "pointermove", move);
    on(el, "pointerleave", leave);
  }
  return () => offs.forEach((off) => off());
}
