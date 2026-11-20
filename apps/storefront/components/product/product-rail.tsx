"use client";

import type { ProductCardDTO } from "@store/types";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { ArrowRightIcon, ChevronLeftIcon, ChevronRightIcon } from "../icons";
import { ProductCard } from "./product-card";

/** A titled, horizontally scrolling row of product cards with arrow buttons. */
export function ProductRail({
  title,
  products,
  href,
  linkLabel = "See all",
  subtitle,
  eyebrow,
}: {
  title: string;
  products: ProductCardDTO[];
  href?: string;
  linkLabel?: string;
  subtitle?: string;
  /** Small gold label above the title, e.g. "Most loved". */
  eyebrow?: string;
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
    "border-line bg-canvas hover:bg-brand-600 hover:border-brand-600 grid size-10 place-items-center rounded-full border transition-colors hover:text-white disabled:pointer-events-none disabled:opacity-30";

  return (
    <section aria-labelledby={headingId}>
      <div className="mb-7 flex items-end justify-between gap-4">
        <div>
          {eyebrow && <p className="eyebrow text-accent-700 mb-3">{eyebrow}</p>}
          <h2 id={headingId} className="display text-3xl sm:text-4xl">
            {title}
          </h2>
          {subtitle && <p className="text-muted mt-3 text-sm sm:text-base">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          {href && (
            <Link
              href={href}
              className="border-line hover:border-brand-600 group mr-1 hidden items-center gap-2 rounded-full border bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors sm:inline-flex"
            >
              {linkLabel}
              <ArrowRightIcon
                width={14}
                height={14}
                className="transition-transform duration-300 group-hover:translate-x-0.5"
              />
            </Link>
          )}
          {href && (
            <Link href={href} className="text-brand-700 text-sm font-semibold sm:hidden">
              {linkLabel}
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
        className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-4 pb-2 sm:mx-0 sm:gap-4 sm:px-0"
      >
        {products.map((p) => (
          <li
            key={p.id}
            className="w-[46%] shrink-0 snap-start sm:w-[31%] lg:w-[23.5%] xl:w-[18.8%]"
          >
            <ProductCard product={p} />
          </li>
        ))}
      </ul>
    </section>
  );
}
