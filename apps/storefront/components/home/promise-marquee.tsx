"use client";

import { formatMoney } from "@store/types";
import { cn } from "@store/ui";
import { useEffect, useRef, useState } from "react";
import { loadGsap } from "@/lib/gsap";
import { BadgeCheckIcon, CashIcon, ClockIcon, RefreshIcon, SparkleIcon, TruckIcon } from "../icons";
import { freeDeliveryFrom, useSite } from "../site-context";

/**
 * A navy ticker of the store's promises. With GSAP it scrolls endlessly, speeds
 * up while the page is scrolled, and runs backwards when scrolling up. Without
 * GSAP (or with Reduce motion) it is a still row that can be swiped.
 */
export function PromiseMarquee() {
  const free = freeDeliveryFrom(useSite().delivery);
  const track = useRef<HTMLDivElement>(null);
  // Anything that moves on its own needs a pause button (WCAG 2.2.2).
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  const loopRef = useRef<{ pause: () => void; resume: () => void } | null>(null);
  const items = [
    { icon: BadgeCheckIcon, text: "100% genuine products" },
    { icon: CashIcon, text: "Cash on Delivery" },
    {
      icon: TruckIcon,
      text: free !== null ? `Free delivery over ${formatMoney(free)}` : "Delivery across Pakistan",
    },
    { icon: RefreshIcon, text: "7-day easy returns" },
    { icon: ClockIcon, text: "Checked for expiry" },
    { icon: SparkleIcon, text: "Skincare · Makeup · Fragrance · Wellness" },
  ];

  useEffect(() => {
    const ready = loadGsap();
    const el = track.current;
    if (!ready || !el) return;
    let revert: (() => void) | undefined;
    let cancelled = false;
    void ready.then(({ gsap, ScrollTrigger }) => {
      if (cancelled) return;
      // Two copies side by side: moving by one copy's width loops seamlessly.
      el.dataset.running = "";
      const loop = gsap.to(el, { xPercent: -50, ease: "none", duration: 28, repeat: -1 });
      loopRef.current = loop;
      setRunning(true);
      let direction = 1;
      const st = ScrollTrigger.create({
        onUpdate: (self) => {
          if (pausedRef.current) return;
          direction = self.direction;
          const boost = Math.min(Math.abs(self.getVelocity()) / 250, 5);
          // Faster while scrolling, then easing back to the normal speed.
          gsap.to(loop, {
            timeScale: direction * (1 + boost),
            duration: 0.2,
            overwrite: true,
            onComplete: () => void gsap.to(loop, { timeScale: direction, duration: 1.2 }),
          });
        },
      });
      const slow = () =>
        !pausedRef.current && gsap.to(loop, { timeScale: 0.2 * direction, duration: 0.6 });
      const resume = () =>
        !pausedRef.current && gsap.to(loop, { timeScale: direction, duration: 0.6 });
      el.parentElement?.addEventListener("pointerenter", slow);
      el.parentElement?.addEventListener("pointerleave", resume);
      revert = () => {
        loop.kill();
        st.kill();
        el.parentElement?.removeEventListener("pointerenter", slow);
        el.parentElement?.removeEventListener("pointerleave", resume);
        gsap.set(el, { clearProps: "transform" });
        delete el.dataset.running;
        loopRef.current = null;
        setRunning(false);
      };
    });
    return () => {
      cancelled = true;
      revert?.();
    };
  }, []);

  // Still (no GSAP, or Reduce motion): one centred row that wraps.
  // Running: two copies side by side in a single line that GSAP moves.
  const row = (copy: number) => (
    <ul
      aria-hidden={copy > 0 || undefined}
      className={cn(
        "shrink-0 items-center gap-x-10 gap-y-2",
        copy > 0
          ? "hidden pr-10 group-data-[running]:flex"
          : "flex flex-wrap justify-center group-data-[running]:flex-nowrap group-data-[running]:pr-10",
      )}
    >
      {items.map(({ icon: Icon, text }) => (
        <li key={text} className="flex shrink-0 items-center gap-2.5 whitespace-nowrap">
          <Icon width={18} height={18} className="text-accent-500" />
          <span className="text-sm font-semibold tracking-wide text-white sm:text-base">
            {text}
          </span>
          <span aria-hidden className="text-accent-500 ml-8 hidden group-data-[running]:inline">
            ✦
          </span>
        </li>
      ))}
    </ul>
  );

  const togglePause = () => {
    const next = !paused;
    pausedRef.current = next;
    setPaused(next);
    if (next) loopRef.current?.pause();
    else loopRef.current?.resume();
  };

  return (
    <section
      aria-label="Our promises"
      className="bg-brand-700 relative overflow-hidden px-4 py-4 has-[[data-running]]:px-0 has-[[data-running]]:[mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]"
    >
      <div
        ref={track}
        className="group flex justify-center data-[running]:w-max data-[running]:justify-start"
      >
        {row(0)}
        {row(1)}
      </div>
      {running && (
        <button
          type="button"
          onClick={togglePause}
          aria-label={paused ? "Play the promises ticker" : "Pause the promises ticker"}
          className="bg-brand-700 absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-white ring-1 ring-white/30 transition hover:bg-white/15 sm:right-4"
        >
          {paused ? (
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden fill="currentColor">
              <path d="M3 1.5v9l7.5-4.5z" />
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden fill="currentColor">
              <path d="M2.5 1.5h2.5v9H2.5zM7 1.5h2.5v9H7z" />
            </svg>
          )}
        </button>
      )}
    </section>
  );
}
