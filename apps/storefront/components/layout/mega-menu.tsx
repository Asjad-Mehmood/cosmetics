"use client";

import { cn } from "@store/ui";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDownIcon, GridIcon } from "../icons";
import type { NavData } from "./header";

/** "All categories" dropdown: category tiles with photos, plus collections. */
export function MegaMenu({ categories, collections }: NavData) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  // Hovering opens the menu; the click that usually follows must not close it again.
  const openedByHover = useRef(false);
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onClick = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  return (
    <div
      ref={ref}
      className="shrink-0"
      onMouseEnter={() => {
        openedByHover.current = !open;
        setOpen(true);
      }}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls="mega-menu"
        onClick={() => {
          if (openedByHover.current) {
            openedByHover.current = false;
            return;
          }
          setOpen((o) => !o);
        }}
        className="bg-brand-600 hover:bg-brand-700 mr-2 flex h-9 items-center gap-2 rounded-full pl-3 pr-3.5 text-sm font-semibold text-white"
      >
        <GridIcon width={16} height={16} />
        All categories
        <ChevronDownIcon className={cn("transition-transform", open && "rotate-180")} />
      </button>
      <div
        id="mega-menu"
        hidden={!open}
        className="ui-popover absolute inset-x-0 top-full z-50 pt-px"
      >
        <div className="border-line bg-canvas shadow-(--shadow-pop) border-b">
          <div className="mx-auto grid max-w-7xl grid-cols-[1fr_220px] gap-10 px-8 py-8">
            <div>
              <p className="text-muted text-xs font-semibold uppercase tracking-wider">
                Shop by category
              </p>
              <ul className="mt-4 grid grid-cols-3 gap-3 xl:grid-cols-5">
                {categories.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/categories/${c.slug}`}
                      className="hover:border-brand-600 border-line group flex items-center gap-3 rounded-2xl border p-2.5 transition"
                    >
                      <span className="bg-surface relative size-12 shrink-0 overflow-hidden rounded-xl">
                        {c.imageUrl && (
                          <Image
                            src={c.imageUrl}
                            alt=""
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold group-hover:underline">
                          {c.name}
                        </span>
                        <span className="text-muted block text-xs">
                          {c.productCount} {c.productCount === 1 ? "product" : "products"}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link
                href="/shop"
                className="text-brand-700 mt-5 inline-block text-sm font-semibold hover:underline"
              >
                Browse all products →
              </Link>
            </div>
            <div>
              <p className="text-muted text-xs font-semibold uppercase tracking-wider">
                Collections
              </p>
              <ul className="mt-4 space-y-1">
                <li>
                  <Link
                    href="/offers"
                    className="text-accent-700 hover:bg-surface block rounded-lg px-2 py-1.5 text-sm font-semibold"
                  >
                    Offers
                  </Link>
                </li>
                {collections.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/collections/${c.slug}`}
                      className="hover:bg-surface block rounded-lg px-2 py-1.5 text-sm"
                    >
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
