/** Sort options for product listings (`?sort=`). */
export const PRODUCT_SORTS = [
  "newest",
  "price_asc",
  "price_desc",
  "best_selling",
  "top_rated",
  /** Best match first (search only; falls back to newest without a query). */
  "relevance",
] as const;
export type ProductSort = (typeof PRODUCT_SORTS)[number];

const LETTER_SIZES = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "3XL"];
/** Units that measure the same thing, converted to one base unit. */
const UNITS: Record<string, [base: string, factor: number]> = {
  ml: ["ml", 1],
  l: ["ml", 1000],
  ltr: ["ml", 1000],
  g: ["g", 1],
  gm: ["g", 1],
  kg: ["g", 1000],
  mg: ["g", 0.001],
  oz: ["oz", 1],
};

function sizeKey(size: string): { unit: string; value: number } | null {
  const m = /^\s*(\d+(?:\.\d+)?)\s*([a-z]*)/i.exec(size);
  if (!m) return null;
  const word = m[2]!.toLowerCase();
  const [unit, factor] = UNITS[word] ?? [word, 1];
  return { unit, value: Number(m[1]) * factor };
}

/**
 * Sort pack sizes naturally: "15 ml" < "30 ml" < "1 l", "30 tablets" <
 * "60 tablets", S < M < L. Measured sizes come first, grouped by unit, then
 * letter sizes, then anything else alphabetically.
 */
export function compareSizes(a: string, b: string): number {
  const ka = sizeKey(a);
  const kb = sizeKey(b);
  if (ka && kb) return ka.unit === kb.unit ? ka.value - kb.value : ka.unit.localeCompare(kb.unit);
  if (ka || kb) return ka ? -1 : 1;
  const ia = LETTER_SIZES.indexOf(a.toUpperCase());
  const ib = LETTER_SIZES.indexOf(b.toUpperCase());
  if (ia !== -1 || ib !== -1) return (ia === -1 ? Infinity : ia) - (ib === -1 ? Infinity : ib);
  return a.localeCompare(b);
}
