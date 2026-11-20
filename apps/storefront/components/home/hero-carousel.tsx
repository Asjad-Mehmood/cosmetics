"use client";

import type { BannerDTO, ProductCardDTO } from "@store/types";
import { formatMoney } from "@store/types";
import { cn } from "@store/ui";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRightIcon, ChevronLeftIcon, ChevronRightIcon } from "../icons";

const INTERVAL = 7000;

/**
 * The homepage hero (WAI-ARIA carousel pattern): a dark navy stage with the
 * banner photo slowly zooming behind giant headline type, and a frosted-glass
 * card featuring a best seller. Auto-advances, pauses on hover, focus or when
 * motion is reduced, and can be swiped on touch screens.
 */
export function HeroCarousel({
  banners,
  featured,
}: {
  banners: BannerDTO[];
  featured?: ProductCardDTO;
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const touchX = useRef<number | null>(null);
  const count = banners.length;

  const go = useCallback((i: number) => setIndex(((i % count) + count) % count), [count]);

  useEffect(() => {
    if (count < 2 || paused || userPaused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % count), INTERVAL);
    return () => clearInterval(t);
  }, [count, paused, userPaused]);

  if (!count) return null;

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured"
      className="bg-brand-900 relative isolate overflow-hidden rounded-[2rem]"
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
        className="relative h-[560px] sm:h-[600px] lg:h-[640px]"
        aria-live={paused || userPaused ? "polite" : "off"}
      >
        {banners.map((b, i) => {
          const active = i === index;
          return (
            <div
              key={b.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${count}`}
              aria-hidden={!active}
              inert={!active}
              className={cn(
                "absolute inset-0 transition-opacity duration-700",
                active ? "opacity-100" : "opacity-0",
              )}
            >
              {/* The photo drifts closer while its slide is showing. */}
              <Image
                src={b.imageUrl}
                alt=""
                fill
                priority={i === 0}
                sizes="(min-width: 1280px) 1250px, 100vw"
                className={cn(
                  "object-cover transition-transform duration-[8s] ease-out",
                  active ? "motion-safe:scale-110" : "scale-100",
                )}
              />
              <span className="from-brand-900 via-brand-900/80 to-brand-900/30 absolute inset-0 bg-gradient-to-r" />
              <span className="from-brand-900/90 absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t to-transparent" />

              <div className="relative flex h-full flex-col justify-center px-6 pb-16 sm:px-12 lg:max-w-[60%]">
                <div
                  key={active ? `in-${index}` : "out"}
                  className={cn(active && "motion-safe:animate-fade-up")}
                >
                  <p className="eyebrow text-accent-500 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 backdrop-blur">
                    100% genuine · Cash on delivery
                  </p>
                  <h2 className="display mt-6 text-5xl text-white sm:text-6xl lg:text-7xl xl:text-8xl">
                    {b.title}
                  </h2>
                  {b.subtitle && (
                    <p className="mt-6 max-w-md text-base leading-relaxed text-white/75 sm:text-lg">
                      {b.subtitle}
                    </p>
                  )}
                  <div className="mt-8 flex flex-wrap gap-3">
                    <Link
                      href={b.link ?? "/shop"}
                      className="bg-accent-500 text-brand-700 group inline-flex h-12 items-center gap-3 rounded-full pl-6 pr-1.5 text-sm font-bold uppercase tracking-wider transition hover:brightness-105"
                    >
                      {b.ctaLabel ?? "Shop now"}
                      <span className="bg-brand-700 text-accent-500 grid size-9 place-items-center rounded-full transition-transform duration-300 group-hover:-rotate-45">
                        <ArrowRightIcon width={16} height={16} />
                      </span>
                    </Link>
                    <Link
                      href="/shop"
                      className="hidden h-12 items-center rounded-full border border-white/25 px-6 text-sm font-bold uppercase tracking-wider text-white backdrop-blur transition-colors hover:bg-white/10 sm:inline-flex"
                    >
                      Browse everything
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {featured?.image && (
          <Link
            href={`/products/${featured.slug}`}
            className="group absolute right-8 top-1/2 hidden w-[300px] -translate-y-1/2 rounded-3xl border border-white/15 bg-white/10 p-3 text-white shadow-2xl backdrop-blur-xl transition duration-500 hover:-translate-y-[calc(50%+6px)] lg:block xl:right-12 xl:w-[330px]"
          >
            <span className="relative block aspect-[4/3] overflow-hidden rounded-2xl bg-white/10">
              <Image
                src={featured.image.url}
                alt=""
                fill
                sizes="330px"
                className="object-cover transition-transform duration-[8s] ease-out group-hover:scale-110"
              />
            </span>
            <span className="block px-2 pb-2 pt-4">
              <span className="eyebrow text-accent-500">Best seller</span>
              <span className="mt-2 block text-lg font-extrabold leading-snug">
                {featured.title}
              </span>
              <span className="mt-1 flex items-center justify-between text-sm text-white/70">
                {featured.hasPriceRange ? "From " : ""}
                {formatMoney(featured.price)}
                <span className="text-accent-500 inline-flex items-center gap-1 font-semibold">
                  Shop now <ArrowRightIcon width={14} height={14} />
                </span>
              </span>
            </span>
          </Link>
        )}
      </div>

      {count > 1 && (
        <div className="absolute inset-x-6 bottom-6 flex items-center justify-between sm:inset-x-12">
          <div className="flex items-center gap-2">
            {banners.map((b, i) => (
              <button
                key={b.id}
                type="button"
                onClick={() => go(i)}
                aria-label={`Show slide ${i + 1}: ${b.title}`}
                aria-current={i === index}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-500",
                  i === index ? "bg-accent-500 w-10" : "w-4 bg-white/40 hover:bg-white/70",
                )}
              />
            ))}
            <button
              type="button"
              onClick={() => setUserPaused((p) => !p)}
              aria-label={userPaused ? "Play slideshow" : "Pause slideshow"}
              className="ml-2 grid size-6 place-items-center rounded-full text-white/70 hover:text-white"
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
          <div className="hidden gap-2 md:flex">
            <button
              type="button"
              onClick={() => go(index - 1)}
              aria-label="Previous slide"
              className="grid size-10 place-items-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20"
            >
              <ChevronLeftIcon />
            </button>
            <button
              type="button"
              onClick={() => go(index + 1)}
              aria-label="Next slide"
              className="grid size-10 place-items-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20"
            >
              <ChevronRightIcon />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
