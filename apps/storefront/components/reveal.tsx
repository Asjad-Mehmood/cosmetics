"use client";

import { cn } from "@store/ui";
import { type ElementType, type ReactNode, useEffect, useRef, useState } from "react";
import { reducedMotion } from "@/lib/motion";

/**
 * Fades its content up the first time it scrolls into view. With `stagger`,
 * its children marked `.reveal-item` (give each `style={{ "--i": n }}`) come
 * in one after another instead.
 *
 * Content that is already on screen when the page loads never animates (no
 * delay to the first paint), nothing is hidden without JavaScript, and with
 * Reduce motion everything is simply shown.
 */
export function Reveal({
  children,
  className,
  stagger = false,
  as: Tag = "div",
  ...props
}: {
  children: ReactNode;
  className?: string;
  stagger?: boolean;
  as?: ElementType;
} & Record<string, unknown>) {
  const ref = useRef<HTMLElement>(null);
  // "shown" until we know it is below the fold, so the server HTML is never hidden.
  const [state, setState] = useState<"shown" | "hidden" | "in">("shown");

  useEffect(() => {
    const el = ref.current;
    if (!el || reducedMotion() || !("IntersectionObserver" in window)) return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return;
    setState("hidden");
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry!.isIntersecting) return;
        setState("in");
        io.disconnect();
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      data-reveal={state}
      className={cn(stagger ? "reveal-group" : "reveal-block", className)}
      {...props}
    >
      {children}
    </Tag>
  );
}
