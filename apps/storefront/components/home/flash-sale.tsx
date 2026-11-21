"use client";

import type { HomeContentDTO, ProductCardDTO } from "@store/types";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronRightIcon } from "../icons";
import { ProductRail } from "../product/product-rail";

type Sale = NonNullable<HomeContentDTO["flashSale"]>;

const pad = (n: number) => String(n).padStart(2, "0");

/** One flip-card digit: a new value flips down into place. */
function Digit({ value }: { value: string }) {
  return (
    <span className="flip-digit relative grid h-12 w-9 place-items-center overflow-hidden rounded-lg bg-black/30 text-2xl font-extrabold tabular-nums text-white shadow-[inset_0_-2px_0_rgb(0_0_0_/_0.25)] sm:h-14 sm:w-11 sm:text-3xl">
      <span key={value} className="animate-flip-in">
        {value}
      </span>
      {/* The fold line across the middle of a flip card. */}
      <span aria-hidden className="absolute inset-x-0 top-1/2 h-px bg-black/30" />
    </span>
  );
}

function Unit({ value, label }: { value: number; label: string }) {
  const [a, b] = pad(value).split("") as [string, string];
  return (
    <span className="flex flex-col items-center gap-1.5">
      <span className="flex gap-1">
        <Digit value={a} />
        <Digit value={b} />
      </span>
      <span className="text-[11px] font-semibold uppercase tracking-widest text-white/70">
        {label}
      </span>
    </span>
  );
}

/**
 * The flash sale switched on in the admin: a countdown with flip digits over
 * the products on sale. When the time runs out it turns back into the normal
 * "Offers" row.
 */
export function FlashSale({ sale, products }: { sale: Sale; products: ProductCardDTO[] }) {
  const end = new Date(sale.endsAt).getTime();
  // Worked out after hydration (the server's clock and the visitor's differ).
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const left = now === null ? null : Math.max(0, end - now);
  if (left === 0) {
    return (
      <ProductRail
        title="Offers"
        subtitle="Genuine products at lower prices"
        products={products}
        href="/offers"
        linkLabel="See all offers"
      />
    );
  }

  const s = Math.floor((left ?? 0) / 1000);
  const parts = {
    days: Math.floor(s / 86400),
    hours: Math.floor(s / 3600) % 24,
    minutes: Math.floor(s / 60) % 60,
    seconds: s % 60,
  };
  // The bar drains over the last 24 hours.
  const share = left === null ? 1 : Math.min(1, left / 86_400_000);
  const endsLabel = new Date(sale.endsAt).toLocaleString("en-PK", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <section aria-labelledby="flash-heading" className="overflow-hidden rounded-[2rem]">
      <div className="bg-brand-700 relative isolate overflow-hidden px-5 py-7 text-white sm:px-10 sm:py-9">
        {/* Soft orange glow behind the countdown. */}
        <span
          aria-hidden
          className="bg-accent-500/30 absolute -right-24 -top-24 -z-10 size-80 rounded-full blur-3xl motion-safe:animate-[float_6s_ease-in-out_infinite]"
        />
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-accent-500 flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                aria-hidden
                className="flash-bolt"
                fill="currentColor"
              >
                <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />
              </svg>
              Flash sale
            </p>
            <h2
              id="flash-heading"
              className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl"
            >
              {sale.title}
            </h2>
            {sale.subtitle && <p className="mt-2 max-w-lg text-white/80">{sale.subtitle}</p>}
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-white/80">Ends in</p>
            <div
              role="timer"
              aria-label={`Sale ends ${endsLabel}`}
              className="flex items-start gap-2 [perspective:400px] sm:gap-3"
            >
              {parts.days > 0 && <Unit value={parts.days} label="Days" />}
              <Unit value={parts.hours} label="Hours" />
              <Unit value={parts.minutes} label="Mins" />
              <Unit value={parts.seconds} label="Secs" />
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-4">
          <div aria-hidden className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/15">
            <div
              className="bg-accent-500 h-full origin-left rounded-full transition-transform duration-1000 ease-linear"
              style={{ transform: `scaleX(${share})` }}
            />
          </div>
          <Link
            href="/offers"
            className="text-accent-500 group inline-flex shrink-0 items-center gap-1 text-sm font-semibold hover:underline"
          >
            Shop the sale
            <ChevronRightIcon
              width={16}
              height={16}
              className="transition-transform group-hover:translate-x-1"
            />
          </Link>
        </div>
      </div>
      <div className="bg-surface px-3 pb-6 pt-6 sm:px-6">
        <ProductRail title="On sale now" products={products} href="/offers" linkLabel="See all" />
      </div>
    </section>
  );
}
