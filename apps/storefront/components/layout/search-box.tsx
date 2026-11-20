"use client";

import type { ApiResponse, SearchSuggestionsDTO } from "@store/types";
import { formatMoney } from "@store/types";
import { cn } from "@store/ui";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { api } from "@/lib/api";
import { POPULAR_SEARCHES } from "@/lib/config";
import { SearchIcon, XIcon } from "../icons";

function useDebounced<T>(value: T, ms: number) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

type Option = {
  href: string;
  label: string;
  kind: "product" | "category" | "all" | "popular";
  image?: string | null;
  price?: number;
};

/** Focuses the search box that is currently on screen (used by the mobile bottom bar). */
export function focusSiteSearch() {
  const boxes = document.querySelectorAll<HTMLInputElement>("[data-site-search]");
  const visible = [...boxes].find((b) => b.offsetParent !== null);
  window.scrollTo({ top: 0, behavior: "smooth" });
  visible?.focus();
}

/**
 * Header search with suggestions as you type (WAI-ARIA combobox): products with
 * photo and price, categories, and popular searches while the box is empty.
 */
export function SearchBar({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const listId = useId();
  const wrapper = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(-1);
  const term = useDebounced(q.trim(), 200);

  const suggestions = useQuery({
    queryKey: ["search-suggest", term],
    queryFn: async () =>
      (
        await api<ApiResponse<SearchSuggestionsDTO>>(
          `/search/suggest?q=${encodeURIComponent(term)}`,
        )
      ).data,
    enabled: term.length >= 2,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
  const data = term.length >= 2 ? suggestions.data : undefined;
  const searchHref = (text: string) => `/search?q=${encodeURIComponent(text)}`;

  const options: Option[] = q.trim()
    ? [
        ...(data?.products.map((p) => ({
          href: `/products/${p.slug}`,
          label: p.title,
          kind: "product" as const,
          image: p.image,
          price: p.price,
        })) ?? []),
        ...(data?.categories.map((c) => ({
          href: `/categories/${c.slug}`,
          label: c.name,
          kind: "category" as const,
        })) ?? []),
        { href: searchHref(q.trim()), label: `See all results for "${q.trim()}"`, kind: "all" },
      ]
    : POPULAR_SEARCHES.map((s) => ({ href: searchHref(s), label: s, kind: "popular" as const }));

  useEffect(() => setActive(-1), [term]);
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) =>
      !wrapper.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const go = (href: string) => {
    setOpen(false);
    setQ("");
    input.current?.blur();
    router.push(href);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((a) => Math.min(options.length - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(-1, a - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const option = open ? options[active] : undefined;
      if (option) go(option.href);
      else if (q.trim()) go(searchHref(q.trim()));
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const optionId = (i: number) => `${listId}-${i}`;
  const showList = open && options.length > 0;
  const noMatches =
    term.length >= 2 && data && data.products.length === 0 && data.categories.length === 0;

  return (
    <div ref={wrapper} className="relative w-full">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          if (q.trim()) go(searchHref(q.trim()));
        }}
        className="relative"
      >
        <SearchIcon
          className="text-muted pointer-events-none absolute left-4 top-1/2 -translate-y-1/2"
          width={18}
          height={18}
        />
        <input
          ref={input}
          data-site-search
          type="search"
          role="combobox"
          aria-label="Search products"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showList && active >= 0 ? optionId(active) : undefined}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={
            compact ? "Search products" : "Search skincare, makeup, vitamins, medicines…"
          }
          className={cn(
            "bg-surface border-line text-ink placeholder:text-muted w-full rounded-full border pl-11 pr-11 text-sm transition",
            "focus:border-brand-600 focus:bg-canvas focus:ring-brand-600/15 focus:outline-none focus:ring-4",
            "[&::-webkit-search-cancel-button]:hidden",
            compact ? "h-11" : "h-12",
          )}
          autoComplete="off"
        />
        {q && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              setQ("");
              input.current?.focus();
            }}
            className="text-muted hover:text-ink absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1"
          >
            <XIcon width={16} height={16} />
          </button>
        )}
      </form>

      <div
        hidden={!showList}
        className="border-line bg-canvas shadow-(--shadow-pop) absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border p-2"
      >
        {!q.trim() && (
          <p className="text-muted px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wider">
            Popular searches
          </p>
        )}
        <ul
          id={listId}
          role="listbox"
          aria-label="Suggestions"
          className={cn(!q.trim() && "flex flex-wrap gap-2 px-2 pb-2 pt-1")}
        >
          {options.map((o, i) => (
            <li
              key={o.href}
              id={optionId(i)}
              role="option"
              aria-selected={i === active}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => go(o.href)}
              className={cn(
                "cursor-pointer text-sm",
                o.kind === "popular"
                  ? cn(
                      "border-line rounded-full border px-3 py-1.5",
                      i === active && "border-brand-600 bg-brand-50",
                    )
                  : cn(
                      "flex items-center gap-3 rounded-xl px-2 py-2",
                      i === active && "bg-surface",
                    ),
              )}
            >
              {o.kind === "product" ? (
                <>
                  <span className="bg-surface relative size-11 shrink-0 overflow-hidden rounded-lg">
                    {o.image && (
                      <Image src={o.image} alt="" fill sizes="44px" className="object-cover" />
                    )}
                  </span>
                  <span className="flex-1 font-medium">{o.label}</span>
                  {o.price !== undefined && (
                    <span className="text-muted">{formatMoney(o.price)}</span>
                  )}
                </>
              ) : o.kind === "category" ? (
                <span>
                  <span className="text-muted">Category: </span>
                  <span className="font-medium">{o.label}</span>
                </span>
              ) : o.kind === "all" ? (
                <span className="text-brand-700 font-semibold">{o.label}</span>
              ) : (
                o.label
              )}
            </li>
          ))}
        </ul>
        {noMatches && (
          <p className="text-muted px-3 py-2 text-sm">
            No matches yet. Press Enter to search anyway.
          </p>
        )}
      </div>
    </div>
  );
}
