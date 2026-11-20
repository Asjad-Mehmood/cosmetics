"use client";

import type { FiltersDTO } from "@store/types";
import { Button, cn, Dialog, Input } from "@store/ui";
import { useState, type ReactNode } from "react";
import { CheckIcon, ChevronDownIcon, FilterIcon } from "../icons";
import { useListingNav } from "./listing-nav";

function toggle(list: string[], value: string) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

function useListParam(key: string) {
  const { params, update } = useListingNav();
  const values = params.get(key)?.split(",").filter(Boolean) ?? [];
  return [
    values,
    (value: string) => update({ [key]: toggle(values, value).join(",") || null }),
  ] as const;
}

/** A collapsible filter group. */
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details open className="border-line group border-b py-4 first:pt-0">
      <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDownIcon className="text-muted transition-transform group-open:rotate-180" />
      </summary>
      <div className="pt-3">{children}</div>
    </details>
  );
}

/** Price bands in rupees: [label, min, max]. */
const PRICE_BANDS: [string, number | null, number | null][] = [
  ["Under Rs 1,000", null, 1000],
  ["Rs 1,000 – 2,500", 1000, 2500],
  ["Rs 2,500 – 5,000", 2500, 5000],
  ["Over Rs 5,000", 5000, null],
];

function PriceFilter({ range }: { range: FiltersDTO["price"] }) {
  const { params, update } = useListingNav();
  const [min, setMin] = useState(params.get("min") ?? "");
  const [max, setMax] = useState(params.get("max") ?? "");
  const lo = Math.floor(range.min / 100);
  const hi = Math.ceil(range.max / 100);
  const current = `${params.get("min") ?? ""}-${params.get("max") ?? ""}`;

  return (
    <div className="space-y-3">
      <ul className="space-y-1">
        {PRICE_BANDS.map(([label, from, to]) => {
          const key = `${from ?? ""}-${to ?? ""}`;
          const on = current === key;
          return (
            <li key={label}>
              <button
                type="button"
                aria-pressed={on}
                onClick={() =>
                  update(
                    on
                      ? { min: null, max: null }
                      : {
                          min: from === null ? null : String(from),
                          max: to === null ? null : String(to),
                        },
                  )
                }
                className={cn(
                  "hover:bg-surface flex w-full items-center gap-2.5 rounded-lg px-1 py-1.5 text-left text-sm",
                  on && "font-semibold",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "grid size-4 place-items-center rounded-full border",
                    on ? "border-brand-600 bg-brand-600 text-white" : "border-line",
                  )}
                >
                  {on && <span className="size-1.5 rounded-full bg-white" />}
                </span>
                {label}
              </button>
            </li>
          );
        })}
      </ul>
      <form
        className="flex items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          update({ min: min || null, max: max || null });
        }}
      >
        <label className="flex-1 text-xs">
          <span className="text-muted">Min (Rs)</span>
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder={String(lo)}
            value={min}
            onChange={(e) => setMin(e.target.value)}
            className="mt-1 h-9 rounded-full"
          />
        </label>
        <label className="flex-1 text-xs">
          <span className="text-muted">Max (Rs)</span>
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder={String(hi)}
            value={max}
            onChange={(e) => setMax(e.target.value)}
            className="mt-1 h-9 rounded-full"
          />
        </label>
        <Button type="submit" variant="outline" size="sm" pill className="h-9">
          Go
        </Button>
      </form>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between py-1.5 text-sm">
      {label}
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={onChange}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className="bg-line peer-checked:bg-brand-600 peer-focus-visible:ring-brand-500 relative h-6 w-10 rounded-full transition-colors after:absolute after:left-0.5 after:top-0.5 after:size-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-4 peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2"
      />
    </label>
  );
}

export function FilterPanel({
  filters,
  lockedOnSale = false,
}: {
  filters: FiltersDTO;
  /** The Offers page always shows discounted products, so there is no "On sale" switch. */
  lockedOnSale?: boolean;
}) {
  const { params, update } = useListingNav();
  const [sizes, toggleSize] = useListParam("size");
  const [colors, toggleColor] = useListParam("color");
  const inStock = params.get("inStock") === "true";
  const onSale = params.get("onSale") === "true";

  return (
    <div>
      <Section title="Availability">
        <Toggle
          label="In stock only"
          checked={inStock}
          onChange={() => update({ inStock: inStock ? null : "true" })}
        />
        {!lockedOnSale && (
          <Toggle
            label="On sale"
            checked={onSale}
            onChange={() => update({ onSale: onSale ? null : "true" })}
          />
        )}
      </Section>

      {filters.sizes.length > 0 && (
        <Section title="Size">
          <div className="flex flex-wrap gap-2">
            {filters.sizes.map((size) => (
              <button
                key={size}
                type="button"
                aria-pressed={sizes.includes(size)}
                onClick={() => toggleSize(size)}
                className={cn(
                  "h-9 rounded-full border px-3.5 text-sm font-medium transition",
                  sizes.includes(size)
                    ? "border-brand-600 bg-brand-600 text-white"
                    : "border-line hover:border-brand-600",
                )}
              >
                {size}
              </button>
            ))}
          </div>
        </Section>
      )}

      {filters.colors.length > 1 && (
        <Section title="Shade">
          <ul className="space-y-0.5">
            {filters.colors.map((c) => (
              <li key={c.name}>
                <label className="hover:bg-surface flex cursor-pointer items-center gap-3 rounded-lg px-1 py-1.5 text-sm">
                  <span className="relative grid size-6 shrink-0 place-items-center">
                    {/* The checkbox itself is the swatch. */}
                    <input
                      type="checkbox"
                      checked={colors.includes(c.name)}
                      onChange={() => toggleColor(c.name)}
                      className="border-line checked:ring-brand-600 focus-visible:ring-brand-500 size-6 cursor-pointer appearance-none rounded-full border ring-offset-2 checked:ring-2 focus-visible:outline-none focus-visible:ring-2"
                      style={{ backgroundColor: c.hex ?? undefined }}
                    />
                    {colors.includes(c.name) && (
                      <CheckIcon
                        width={12}
                        height={12}
                        aria-hidden
                        className="pointer-events-none absolute text-white drop-shadow"
                      />
                    )}
                  </span>
                  {c.name}
                </label>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section title="Price">
        <PriceFilter key={`${params.get("min")}-${params.get("max")}`} range={filters.price} />
      </Section>
    </div>
  );
}

/** Mobile: the same panel in a bottom sheet. */
export function MobileFilters({
  filters,
  activeCount,
  resultCount,
  lockedOnSale,
}: {
  filters: FiltersDTO;
  activeCount: number;
  resultCount: number;
  lockedOnSale?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        variant="outline"
        size="sm"
        pill
        onClick={() => setOpen(true)}
        className="h-10 lg:hidden"
      >
        <FilterIcon /> Filters{activeCount > 0 && ` (${activeCount})`}
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Filters"
        variant="bottom"
        footer={
          <Button className="w-full" size="lg" pill onClick={() => setOpen(false)}>
            Show {resultCount} {resultCount === 1 ? "result" : "results"}
          </Button>
        }
      >
        <FilterPanel filters={filters} lockedOnSale={lockedOnSale} />
      </Dialog>
    </>
  );
}
