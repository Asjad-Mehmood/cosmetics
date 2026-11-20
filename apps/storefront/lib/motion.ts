"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** True when the visitor asked their device for less motion. */
export const reducedMotion = () =>
  typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Fired on window when a product has landed in the cart icon. */
export const CART_LANDED = "cart:landed";

/** The cart icon that is on screen now (header, or the phone tab bar). */
function cartTarget(): HTMLElement | null {
  const all = document.querySelectorAll<HTMLElement>("[data-cart-target]");
  for (const el of all) {
    const r = el.getBoundingClientRect();
    if (r.width && r.height && r.bottom > 0 && r.top < window.innerHeight) return el;
  }
  return null;
}

/**
 * "Fly to cart": a small copy of the product photo arcs from `from` to the
 * cart icon (about 600 ms), then the icon jiggles. Resolves when it lands, or
 * at once when motion is reduced, the screen is tiny or nothing is on screen.
 */
export async function flyToCart(from: Element | null | undefined, imageUrl?: string) {
  const done = () => window.dispatchEvent(new Event(CART_LANDED));
  if (reducedMotion() || !from || !imageUrl || window.innerWidth < 340) return done();
  const target = cartTarget();
  const start = from.getBoundingClientRect();
  if (!target || !start.width) return done();
  const end = target.getBoundingClientRect();

  const size = Math.min(start.width, start.height, 160);
  const ghost = document.createElement("img");
  ghost.src = imageUrl;
  ghost.alt = "";
  ghost.setAttribute("aria-hidden", "true");
  ghost.dataset.flyGhost = "";
  Object.assign(ghost.style, {
    position: "fixed",
    zIndex: "100",
    left: `${start.left + start.width / 2 - size / 2}px`,
    top: `${start.top + start.height / 2 - size / 2}px`,
    width: `${size}px`,
    height: `${size}px`,
    objectFit: "cover",
    borderRadius: "24px",
    boxShadow: "0 12px 30px -8px rgb(15 29 56 / 0.45)",
    pointerEvents: "none",
  });
  document.body.appendChild(ghost);

  const dx = end.left + end.width / 2 - (start.left + start.width / 2);
  const dy = end.top + end.height / 2 - (start.top + start.height / 2);
  // Up and over: the midpoint is lifted, so the path is an arc.
  const lift = Math.min(160, Math.abs(dx) * 0.35 + 60);
  const anim = ghost.animate(
    [
      { transform: "translate(0, 0) scale(1)", opacity: 1, borderRadius: "24px" },
      {
        transform: `translate(${dx * 0.55}px, ${dy * 0.45 - lift}px) scale(0.55)`,
        opacity: 1,
        offset: 0.55,
      },
      {
        transform: `translate(${dx}px, ${dy}px) scale(${16 / size})`,
        opacity: 0.4,
        borderRadius: "9999px",
      },
    ],
    { duration: 650, easing: "cubic-bezier(.5,0,.3,1)" },
  );
  try {
    await anim.finished;
  } catch {
    // Cancelled (page changed): nothing to do.
  } finally {
    ghost.remove();
    done();
  }
}

/** A "no" shake (wrong code, missing field). Keeps focus where it is. */
export function shake(el: Element | null | undefined) {
  if (!el || reducedMotion()) return;
  el.animate(
    [
      { transform: "translateX(0)" },
      { transform: "translateX(-6px)" },
      { transform: "translateX(6px)" },
      { transform: "translateX(-4px)" },
      { transform: "translateX(4px)" },
      { transform: "translateX(0)" },
    ],
    { duration: 360, easing: "ease-out" },
  );
}

/** Calls back whenever something lands in the cart (to jiggle the icon). */
export function useCartLanded() {
  const [n, setN] = useState(0);
  useEffect(() => {
    const on = () => setN((x) => x + 1);
    window.addEventListener(CART_LANDED, on);
    return () => window.removeEventListener(CART_LANDED, on);
  }, []);
  return n;
}

/**
 * A short-lived "success" state, e.g. "Added ✓" for 1.2 s after adding to the
 * cart. `flash()` turns it on; it switches itself off.
 */
export function useFlash(ms = 1200) {
  const [on, setOn] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const flash = useCallback(() => {
    clearTimeout(timer.current);
    setOn(true);
    timer.current = setTimeout(() => setOn(false), ms);
  }, [ms]);
  return [on, flash] as const;
}

/** The value from the previous render (for "did it go up or down?"). */
export function usePrevious<T>(value: T) {
  const ref = useRef(value);
  const prev = ref.current;
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return prev;
}

/**
 * A number that counts smoothly to its new value (totals in the cart). Shows
 * the new value at once when motion is reduced.
 */
export function useTweenedNumber(value: number, duration = 450) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    const start = from.current;
    if (start === value || reducedMotion()) {
      from.current = value;
      setShown(value);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - k, 3);
      const v = Math.round(start + (value - start) * eased);
      from.current = v;
      setShown(v);
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return shown;
}

/**
 * A highlight that slides between options (size chips, shade swatches)
 * instead of jumping. Put `ref` on the options' container (position:
 * relative) and render the highlight with `style`. Until it has been
 * measured, `box` is null and each option should draw its own selection.
 */
export function useSlidingHighlight(selected: unknown, selector = `[aria-pressed="true"]`) {
  const ref = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const measure = () => {
      const el = root.querySelector<HTMLElement>(selector);
      setBox(
        el ? { x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight } : null,
      );
    };
    measure();
    // Slide only after the first placement, and re-measure if the layout wraps.
    const t = requestAnimationFrame(() => setAnimate(true));
    const ro = new ResizeObserver(measure);
    ro.observe(root);
    return () => {
      cancelAnimationFrame(t);
      ro.disconnect();
    };
  }, [selected, selector]);

  const style = box
    ? {
        transform: `translate(${box.x}px, ${box.y}px)`,
        width: box.w,
        height: box.h,
        transition: animate
          ? "transform 320ms var(--ease-out), width 320ms var(--ease-out), height 320ms var(--ease-out)"
          : "none",
      }
    : { display: "none" };
  return { ref, box, style };
}
