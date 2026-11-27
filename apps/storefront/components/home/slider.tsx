"use client";

import { cn } from "@store/ui";
import { Children, type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";

/**
 * A row of slides that moves on by itself (one slide every few seconds, back
 * to the start at the end), can be swiped or scrolled, and has dots for each
 * page. It stops moving while the pointer or keyboard focus is on it, while it
 * is off screen, and for people who ask for less motion.
 */
export function Slider({
  children,
  label,
  slideClassName,
  autoplay = 4500,
  arrows = false,
  className,
}: {
  children: ReactNode;
  /** Names the carousel for screen readers. */
  label: string;
  /** Width of each slide, e.g. "basis-full sm:basis-1/2 lg:basis-1/4". */
  slideClassName: string;
  /** Milliseconds between moves; 0 to stay still. */
  autoplay?: number;
  arrows?: boolean;
  className?: string;
}) {
  const track = useRef<HTMLUListElement>(null);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(0);
  const held = useRef(false);
  // Anything that moves on its own needs a way to stop it (WCAG 2.2.2).
  const [stopped, setStopped] = useState(false);
  const stoppedRef = useRef(false);
  stoppedRef.current = stopped;
  const visible = useRef(false);
  const slides = Children.toArray(children);

  const measure = useCallback(() => {
    const el = track.current;
    if (!el) return;
    const n = Math.max(1, Math.round(el.scrollWidth / el.clientWidth));
    setPages(n);
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
    setPage(atEnd ? n - 1 : Math.round(el.scrollLeft / el.clientWidth));
  }, []);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    const io = new IntersectionObserver(([e]) => (visible.current = !!e?.isIntersecting));
    io.observe(el);
    return () => {
      ro.disconnect();
      io.disconnect();
    };
  }, [measure, slides.length]);

  /** Moves by one slide (or back to the first one after the last). */
  const step = useCallback((dir: 1 | -1) => {
    const el = track.current;
    const first = el?.firstElementChild as HTMLElement | null;
    if (!el || !first) return;
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
    const atStart = el.scrollLeft <= 4;
    if (dir === 1 && atEnd) return el.scrollTo({ left: 0, behavior: "smooth" });
    if (dir === -1 && atStart) return el.scrollTo({ left: el.scrollWidth, behavior: "smooth" });
    el.scrollBy({ left: dir * first.offsetWidth, behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (!autoplay || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => {
      if (!held.current && !stoppedRef.current && visible.current && !document.hidden) step(1);
    }, autoplay);
    return () => window.clearInterval(id);
  }, [autoplay, step]);

  const goTo = (i: number) => {
    const el = track.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      className={cn("relative min-w-0", className)}
      onPointerEnter={() => (held.current = true)}
      onPointerLeave={() => (held.current = false)}
      onFocusCapture={() => (held.current = true)}
      onBlurCapture={() => (held.current = false)}
      onTouchStart={() => (held.current = true)}
      onTouchEnd={() => window.setTimeout(() => (held.current = false), 3000)}
    >
      <ul
        ref={track}
        onScroll={measure}
        className="no-scrollbar relative -mx-2 flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain"
      >
        {slides.map((slide, i) => (
          <li key={i} className={cn("shrink-0 snap-start px-2", slideClassName)}>
            {slide}
          </li>
        ))}
      </ul>

      {arrows && pages > 1 && (
        <>
          <button
            type="button"
            onClick={() => step(-1)}
            aria-label="Previous"
            className="bg-canvas hover:bg-ink absolute -left-3 top-1/2 hidden size-10 -translate-y-1/2 place-items-center rounded-full shadow-md transition-colors hover:text-white md:grid"
          >
            <ChevronLeftIcon />
          </button>
          <button
            type="button"
            onClick={() => step(1)}
            aria-label="Next"
            className="bg-canvas hover:bg-ink absolute -right-3 top-1/2 hidden size-10 -translate-y-1/2 place-items-center rounded-full shadow-md transition-colors hover:text-white md:grid"
          >
            <ChevronRightIcon />
          </button>
        </>
      )}

      {pages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-1">
          {Array.from({ length: pages }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Show page ${i + 1} of ${pages}`}
              aria-current={i === page}
              className="grid size-7 place-items-center"
            >
              <span
                className={cn(
                  "block rounded-full transition-all",
                  i === page
                    ? "border-ink size-5 border-[1.5px] [background:radial-gradient(currentColor_0_2.5px,transparent_3px)]"
                    : "bg-muted/50 size-1.5",
                )}
              />
            </button>
          ))}
          {autoplay > 0 && (
            <button
              type="button"
              onClick={() => setStopped((v) => !v)}
              aria-label={stopped ? "Play slides" : "Pause slides"}
              className="text-muted hover:text-ink ml-2 grid size-7 place-items-center"
            >
              {stopped ? (
                <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
                  <path d="M3 1.5v9l7-4.5z" fill="currentColor" />
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
                  <path d="M3 1.5h2v9H3zM7 1.5h2v9H7z" fill="currentColor" />
                </svg>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
