"use client";

import type { CategoryDTO } from "@store/types";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { loadGsap } from "@/lib/gsap";
import { ChevronRightIcon } from "../icons";

/*
 * "Shop by category" as tall photo cards.
 *
 * Desktop with GSAP, when the cards are wider than the page: the section
 * stays on screen and scrolling down moves the cards sideways, each turning
 * slightly in 3D while they move. Phones: a row you swipe. Without GSAP:
 * a grid of cards.
 */
export function CategoryShowcase({ categories }: { categories: CategoryDTO[] }) {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const ready = loadGsap();
    const el = root.current;
    if (!ready || !el) return;
    let revert: (() => void) | undefined;
    let cancelled = false;
    void ready.then(({ gsap, ScrollTrigger }) => {
      if (cancelled) return;
      const mm = gsap.matchMedia();
      mm.add("(min-width: 1024px) and (min-height: 700px)", () => {
        el.dataset.live = "";
        const track = el.querySelector<HTMLElement>("[data-track]")!;
        const cards = gsap.utils.toArray<HTMLElement>("[data-cat-card]", el);
        const travel = () => Math.max(0, track.scrollWidth - track.clientWidth);
        if (travel() < 40) {
          delete el.dataset.live;
          return;
        }
        const turn = gsap.quickTo(cards, "rotationY", { duration: 0.6, ease: "power3" });
        const tween = gsap.to(track.firstElementChild, {
          x: () => -travel(),
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: "top top+=128",
            end: () => `+=${travel() * 1.4}`,
            pin: true,
            scrub: 0.5,
            refreshPriority: 1,
            invalidateOnRefresh: true,
            // Cards lean into the direction of travel, then straighten up.
            onUpdate: (self) => {
              turn(gsap.utils.clamp(-14, 14, self.getVelocity() / -120));
              gsap.delayedCall(0.15, () => turn(0));
            },
          },
        });
        // Keyboard: tabbing to a card off to the side scrolls the page to it.
        const onFocus = (e: FocusEvent) => {
          const card = (e.target as HTMLElement).closest<HTMLElement>("[data-cat-card]");
          const st = tween.scrollTrigger;
          if (!card || !st) return;
          const share = Math.min(1, card.offsetLeft / Math.max(1, travel()));
          window.scrollTo({ top: st.start + share * (st.end - st.start) });
        };
        track.addEventListener("focusin", onFocus);
        ScrollTrigger.sort();
        return () => {
          track.removeEventListener("focusin", onFocus);
          delete el.dataset.live;
        };
      });
      revert = () => mm.revert();
    });
    return () => {
      cancelled = true;
      revert?.();
    };
  }, []);

  return (
    <section ref={root} aria-labelledby="categories-heading" className="category-showcase">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-accent-700 text-xs font-semibold uppercase tracking-widest">
            {categories.length} categories
          </p>
          <h2
            id="categories-heading"
            className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl"
          >
            Shop by category
          </h2>
        </div>
        <Link
          href="/shop"
          className="text-brand-700 group inline-flex items-center gap-1 text-sm font-semibold hover:underline"
        >
          All products
          <ChevronRightIcon
            width={14}
            height={14}
            className="transition-transform group-hover:translate-x-0.5"
          />
        </Link>
      </div>

      <div
        data-track
        className="category-track no-scrollbar -mx-4 overflow-x-auto px-4 lg:mx-0 lg:overflow-visible lg:px-0"
      >
        <ul className="flex snap-x snap-mandatory gap-4 lg:grid lg:grid-cols-5 lg:gap-5">
          {categories.map((c, i) => (
            <li
              key={c.id}
              data-cat-card
              className="w-[68%] shrink-0 snap-start sm:w-[40%] lg:w-auto"
            >
              <Link
                href={`/categories/${c.slug}`}
                className="bg-brand-700 group relative block aspect-[3/4] overflow-hidden rounded-3xl text-white transition-transform active:scale-[.98]"
              >
                {c.imageUrl && (
                  <Image
                    src={c.imageUrl}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 380px, 70vw"
                    priority={i < 2}
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                )}
                <span
                  aria-hidden
                  className="from-brand-700 via-brand-700/60 absolute inset-0 bg-gradient-to-t to-transparent"
                />
                <span className="relative flex h-full flex-col justify-end p-5">
                  <span aria-hidden className="text-accent-500 text-sm font-bold tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="mt-1 text-xl font-extrabold leading-tight sm:text-2xl">
                    {c.name}
                  </span>
                  <span className="mt-1 text-sm text-white/80">
                    {c.productCount} {c.productCount === 1 ? "product" : "products"}
                  </span>
                  <span className="bg-accent-500 text-brand-700 mt-4 inline-flex w-fit items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition-transform group-hover:translate-x-1">
                    Shop now <ChevronRightIcon width={14} height={14} />
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
