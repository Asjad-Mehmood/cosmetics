"use client";

import { formatMoney } from "@store/types";
import { cn } from "@store/ui";
import type { CSSProperties } from "react";
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

const CONFETTI_COLOURS = [
  "var(--color-accent-500)",
  "var(--color-brand-600)",
  "var(--color-accent-700)",
  "var(--color-brand-500)",
  "#ffc400",
];

/** A short burst of confetti in the brand colours (put inside a `relative` element). */
export function Confetti({ pieces = 36 }: { pieces?: number }) {
  return (
    <span className="confetti" aria-hidden>
      {Array.from({ length: pieces }, (_, i) => {
        // Spread evenly left and right, with a little variety (deterministic, so SSR matches).
        const side = i % 2 ? 1 : -1;
        const x = side * (40 + ((i * 37) % 260));
        const r = ((i * 97) % 720) - 360;
        return (
          <i
            key={i}
            style={
              {
                "--i": i,
                "--x": `${x}px`,
                "--r": `${r}deg`,
                "--c": CONFETTI_COLOURS[i % CONFETTI_COLOURS.length],
                width: i % 3 ? 8 : 6,
                height: i % 3 ? 12 : 6,
                borderRadius: i % 3 ? 2 : 9999,
              } as CSSProperties
            }
          />
        );
      })}
    </span>
  );
}
