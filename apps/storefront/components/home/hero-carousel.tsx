"use client";

import type { BannerDTO } from "@store/types";
import { cn } from "@store/ui";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "../icons";

const INTERVAL = 6000;

/**
 * Homepage banners (WAI-ARIA carousel pattern): auto-advances every few
 * seconds, pauses on hover, focus or when motion is reduced, and can be
 * swiped on touch screens.
 */
export function HeroCarousel({ banners }: { banners: BannerDTO[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const touchX = useRef<number | null>(null);
  const count = banners.length;

  const go = useCallback((i: number) => setIndex(((i % count) + count) % count), [count]);

  const [hidden, setHidden] = useState(false);
  const [motion, setMotion] = useState(false);
  const stopped = paused || userPaused || hidden || !motion;

  // No autoplay with Reduce motion; pause while the tab is in the background.
  useEffect(() => {
    setMotion(!window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const onVis = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  // The active dot fills up as the timer runs; the slide changes when it is full.
  // (Driven by the dot's animation, so pausing freezes both together.)
  const next = useCallback(() => setIndex((i) => (i + 1) % count), [count]);

  if (!count) return null;

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured"
      className="relative overflow-hidden rounded-3xl"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onTouchStart={(e) => (touchX.current = e.touches[0]!.clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0]!.clientX - touchX.current;
        if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
        touchX.current = null;
      }}
    >
      <div
        className="flex transition-transform duration-700 ease-out"
        style={{ transform: `translateX(-${index * 100}%)` }}
        aria-live={paused || userPaused ? "polite" : "off"}
      >
        {banners.map((b, i) => (
          <div
            key={b.id}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${count}`}
            aria-hidden={i !== index}
            inert={i !== index}
            className="bg-brand-700 relative h-[340px] w-full shrink-0 sm:h-[400px] lg:h-[460px]"
          >
            {/* The photo drifts slowly closer while its slide is showing. */}
            <Image
              src={b.imageUrl}
              alt=""
              fill
              priority={i === 0}
              sizes="(min-width: 1280px) 1250px, 100vw"
              className={cn(
                "object-cover transition-transform duration-[7s] ease-out",
                i === index ? "motion-safe:scale-110" : "scale-100",
              )}
            />
            <span className="from-brand-700/95 via-brand-700/70 absolute inset-0 bg-gradient-to-r to-transparent" />
            <div
              key={i === index ? `in-${index}` : "out"}
              className="hero-copy relative flex h-full max-w-xl flex-col justify-center px-6 sm:px-12"
            >
              <p className="text-accent-100 text-xs font-semibold uppercase tracking-widest">
                Beauty &amp; pharmacy
              </p>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
                {b.title}
              </h2>
              {b.subtitle && <p className="mt-4 max-w-md text-white/85 sm:text-lg">{b.subtitle}</p>}
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href={b.link ?? "/shop"}
                  className="text-ink inline-flex h-12 items-center rounded-full bg-white px-7 font-semibold hover:bg-white/90"
                >
                  {b.ctaLabel ?? "Shop now"}
                </Link>
                <Link
                  href="/shop"
                  className="hidden h-12 items-center rounded-full border border-white/40 px-6 font-semibold text-white hover:bg-white/10 sm:inline-flex"
                >
                  Browse everything
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(index - 1)}
            aria-label="Previous slide"
            className="bg-canvas/85 hover:bg-canvas absolute bottom-4 right-16 hidden size-10 place-items-center rounded-full shadow md:grid"
          >
            <ChevronLeftIcon />
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            aria-label="Next slide"
            className="bg-canvas/85 hover:bg-canvas absolute bottom-4 right-4 hidden size-10 place-items-center rounded-full shadow md:grid"
          >
            <ChevronRightIcon />
          </button>
          <div className="absolute bottom-4 left-6 flex items-center gap-2 sm:left-12">
            {banners.map((b, i) => (
              <button
                key={b.id}
                type="button"
                onClick={() => go(i)}
                aria-label={`Show slide ${i + 1}: ${b.title}`}
                aria-current={i === index}
                className={cn(
                  "relative h-2 overflow-hidden rounded-full transition-all duration-500",
                  i === index ? "w-10 bg-white/40" : "w-2 bg-white/50 hover:bg-white/80",
                )}
              >
                {i === index && (
                  <span
                    key={index}
                    aria-hidden
                    data-testid="hero-progress"
                    onAnimationEnd={next}
                    className="absolute inset-0 origin-left rounded-full bg-white"
                    style={{
                      animation: motion ? `hero-progress ${INTERVAL}ms linear both` : "none",
                      animationPlayState: stopped ? "paused" : "running",
                    }}
                  />
                )}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setUserPaused((p) => !p)}
              aria-label={userPaused ? "Play slideshow" : "Pause slideshow"}
              className="ml-2 grid size-6 place-items-center rounded-full text-white/80 hover:text-white"
            >
              {userPaused ? (
                <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden fill="currentColor">
                  <path d="M3 1.5v9l7.5-4.5z" />
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden fill="currentColor">
                  <path d="M2.5 1.5h2.5v9H2.5zM7 1.5h2.5v9H7z" />
                </svg>
              )}
            </button>
          </div>
        </>
      )}
    </section>
  );
}
