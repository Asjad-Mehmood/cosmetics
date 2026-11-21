"use client";

import { formatMoney } from "@store/types";
import { cn } from "@store/ui";
import { type CSSProperties, useEffect, useRef } from "react";
import { loadGsap, lowPower } from "@/lib/gsap";
import { usePrevious, useTweenedNumber } from "@/lib/motion";

/**
 * A small number (cart count, quantity) whose new value rolls in: from below
 * when it goes up, from above when it goes down.
 */
export function RollingNumber({
  value,
  className,
}: {
  value: number | string;
  className?: string;
}) {
  const prev = usePrevious(value);
  const up = Number(value) >= Number(prev);
  return (
    <span className={cn("inline-grid overflow-hidden", className)}>
      <span
        key={value}
        className={cn(prev !== value && (up ? "animate-roll-up" : "animate-roll-down"))}
      >
        {value}
      </span>
    </span>
  );
}

/** An amount of money that counts to its new value (cart totals). */
export function TweenedMoney({ value }: { value: number }) {
  const shown = useTweenedNumber(value);
  // Amounts are in paisa: count in whole rupees, and land exactly on the real value.
  return <>{formatMoney(shown === value ? value : Math.round(shown / 100) * 100)}</>;
}

/** A ✓ in a circle that draws itself (success states). */
export function DrawnCheck({ className, delay = 0 }: { className?: string; delay?: number }) {
  const style = (d: number, ms: number): CSSProperties => ({
    strokeDasharray: 1,
    strokeDashoffset: 1,
    animationDelay: `${delay + d}ms`,
    animationDuration: `${ms}ms`,
  });
  return (
    <svg viewBox="0 0 52 52" aria-hidden className={cn("size-6", className)}>
      <circle
        cx="26"
        cy="26"
        r="23"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        pathLength={1}
        className="animate-draw"
        style={style(0, 500)}
      />
      <path
        d="M15 27l7 7 15-16"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        className="animate-draw"
        style={style(380, 350)}
      />
    </svg>
  );
}

/** Six dots bursting outwards (put inside a `relative` element). */
export function Burst() {
  return (
    <span className="burst" aria-hidden>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <i key={i} style={{ "--i": i } as CSSProperties} />
      ))}
    </span>
  );
}

const CONFETTI_COLOURS = ["#f47b20", "#ffc400", "#1b2d52", "#c2410c", "#3b5a94", "#ffffff"];

/**
 * A burst of confetti in the logo's colours, thrown up and falling with
 * gravity (GSAP Physics2D). Put it inside a `relative` element; it fires once
 * on mount. Nothing happens with Reduce motion (GSAP never loads).
 */
export function Confetti({ pieces = 90 }: { pieces?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const ready = loadGsap();
    const box = ref.current;
    if (!ready || !box) return;
    let kill: (() => void) | undefined;
    void ready.then(({ gsap }) => {
      const bits = Array.from({ length: lowPower() ? Math.round(pieces / 2) : pieces }, (_, i) => {
        const bit = document.createElement("i");
        const round = i % 4 === 0;
        Object.assign(bit.style, {
          position: "absolute",
          left: "48px",
          top: "48px",
          width: round ? "7px" : "8px",
          height: round ? "7px" : "13px",
          borderRadius: round ? "9999px" : "2px",
          background: CONFETTI_COLOURS[i % CONFETTI_COLOURS.length],
          boxShadow: "0 0 0 0.5px rgb(15 29 56 / 0.15)",
        });
        box.appendChild(bit);
        return bit;
      });
      const tl = gsap.timeline({ onComplete: () => bits.forEach((b) => b.remove()) });
      bits.forEach((bit, i) => {
        tl.fromTo(
          bit,
          { autoAlpha: 1, scale: gsap.utils.random(0.6, 1.2) },
          {
            physics2D: {
              velocity: gsap.utils.random(380, 820),
              angle: gsap.utils.random(-150, -20),
              gravity: 900,
              friction: 0.02,
            },
            rotation: gsap.utils.random(-900, 900),
            rotationX: gsap.utils.random(-360, 360),
            duration: gsap.utils.random(1.6, 2.6),
            ease: "none",
          },
          i * 0.004,
        );
        tl.to(bit, { autoAlpha: 0, duration: 0.5 }, `>-0.5`);
      });
      kill = () => {
        tl.kill();
        bits.forEach((b) => b.remove());
      };
    });
    return () => kill?.();
  }, [pieces]);
  return (
    <span ref={ref} aria-hidden className="pointer-events-none absolute inset-0 overflow-visible" />
  );
}
