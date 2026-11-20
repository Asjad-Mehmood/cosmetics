"use client";

import type { ProductCardDTO } from "@store/types";
import Link from "next/link";
import { type CSSProperties, useEffect, useId, useRef, useState } from "react";
import { Reveal } from "../reveal";
import { ChevronLeftIcon, ChevronRightIcon } from "../icons";
import { ProductCard } from "./product-card";

/** A titled, horizontally scrolling row of product cards with arrow buttons. */
export function ProductRail({
  title,
  products,
  href,
  linkLabel = "See all",
  subtitle,
}: {
  title: string;
  products: ProductCardDTO[];
  href?: string;
  linkLabel?: string;
  subtitle?: string;
}) {
  const list = useRef<HTMLUListElement>(null);
  const headingId = useId();
  const [edges, setEdges] = useState({ start: true, end: false });

  useEffect(() => {
    const el = list.current;
    if (!el) return;
    const update = () =>
      setEdges({
        start: el.scrollLeft <= 4,
        end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4,
      });
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const scroll = (dir: 1 | -1) =>
    list.current?.scrollBy({ left: dir * list.current.clientWidth * 0.9, behavior: "smooth" });

  if (!products.length) return null;
  const arrow =
    "border-line bg-canvas hover:border-ink grid size-10 place-items-center rounded-full border transition active:scale-90 disabled:opacity-30";
  // Soft fades at the edges that still have more cards to scroll to.
  const mask = `linear-gradient(to right, ${edges.start ? "black" : "transparent"}, black 48px, black calc(100% - 48px), ${
    edges.end ? "black" : "transparent"
  })`;

  return (
    <Reveal as="section" stagger aria-labelledby={headingId}>
      <div className="mb-5 flex items-end justify-between gap-4">
        <div className="reveal-item">
          <h2 id={headingId} className="text-2xl font-bold tracking-tight">
            {title}
          </h2>
          {subtitle && <p className="text-muted mt-1 text-sm">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          {href && (
            <Link
              href={href}
              className="text-brand-700 group mr-2 inline-flex items-center gap-1 text-sm font-semibold hover:underline"
            >
              {linkLabel}
              <ChevronRightIcon
                width={14}
                height={14}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </Link>
          )}
          <button
            type="button"
            className={`${arrow} hidden sm:grid`}
            onClick={() => scroll(-1)}
            disabled={edges.start}
            aria-label={`Scroll ${title} back`}
          >
            <ChevronLeftIcon />
          </button>
          <button
            type="button"
            className={`${arrow} hidden sm:grid`}
            onClick={() => scroll(1)}
            disabled={edges.end}
            aria-label={`Scroll ${title} forward`}
          >
            <ChevronRightIcon />
          </button>
        </div>
      </div>
      <ul
        ref={list}
        style={{ maskImage: mask, WebkitMaskImage: mask }}
        className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-4 pb-2 sm:mx-0 sm:gap-4 sm:px-0"
      >
        {products.map((p, i) => (
          <li
            key={p.id}
            style={{ "--i": i + 1 } as CSSProperties}
            className="reveal-item w-[46%] shrink-0 snap-start sm:w-[31%] lg:w-[23.5%] xl:w-[18.8%]"
          >
            <ProductCard product={p} />
          </li>
        ))}
      </ul>
    </Reveal>
  );
}
