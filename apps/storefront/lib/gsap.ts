"use client";

/*
 * GSAP, loaded on demand: the library and its plugins (about 45 KB gzipped)
 * are fetched after the page is interactive, never on the critical path, and
 * never at all for visitors who asked for reduced motion.
 *
 * GSAP and all of its plugins are free for commercial use
 * (https://gsap.com/standard-license).
 */
import type { gsap as GsapCore } from "gsap";
import type { ScrollTrigger as ScrollTriggerPlugin } from "gsap/ScrollTrigger";
import type { SplitText as SplitTextPlugin } from "gsap/SplitText";
import { reducedMotion } from "./motion";

export type Gsap = typeof GsapCore;
type Plugins = {
  gsap: Gsap;
  ScrollTrigger: typeof ScrollTriggerPlugin;
  SplitText: typeof SplitTextPlugin;
};

let loading: Promise<Plugins> | null = null;

/** GSAP with ScrollTrigger, SplitText, MotionPath, Physics2D and CustomEase registered. */
export function loadGsap(): Promise<Plugins> | null {
  if (typeof window === "undefined" || reducedMotion()) return null;
  loading ??= Promise.all([
    import("gsap"),
    import("gsap/ScrollTrigger"),
    import("gsap/SplitText"),
    import("gsap/MotionPathPlugin"),
    import("gsap/Physics2DPlugin"),
    import("gsap/CustomEase"),
  ]).then(
    ([
      { gsap },
      { ScrollTrigger },
      { SplitText },
      { MotionPathPlugin },
      { Physics2DPlugin },
      { CustomEase },
    ]) => {
      gsap.registerPlugin(ScrollTrigger, SplitText, MotionPathPlugin, Physics2DPlugin, CustomEase);
      // The house easings: a soft, premium settle, and a little overshoot.
      CustomEase.create("ag.out", "0.16, 1, 0.3, 1");
      CustomEase.create("ag.pop", "M0,0 C0.3,0 0.35,1.25 0.6,1.08 0.8,0.97 0.9,1 1,1");
      gsap.defaults({ ease: "ag.out", duration: 0.9 });
      return { gsap, ScrollTrigger, SplitText };
    },
  );
  return loading;
}

/** Already loaded? (For code that should not wait, such as event handlers.) */
let loaded: Plugins | null = null;
export async function gsapNow(): Promise<Plugins | null> {
  if (loaded) return loaded;
  const p = loadGsap();
  if (!p) return null;
  loaded = await p;
  return loaded;
}
