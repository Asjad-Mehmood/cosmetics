import { Button, Input } from "@store/ui";
import type { CategoryDTO } from "@store/types";
import type { Metadata } from "next";
import Link from "next/link";
import { ProductListing } from "@/components/shop/product-listing";
import { POPULAR_SEARCHES } from "@/lib/config";
import type { SearchParams } from "@/lib/listing";
import { getDataSafe } from "@/lib/server-api";

export const metadata: Metadata = { title: "Search", robots: { index: false } };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const slug = typeof sp.category === "string" && sp.category ? sp.category : undefined;
  const category = slug
    ? (await getDataSafe<CategoryDTO[]>("/categories", [], { revalidate: 300 })).find(
        (c) => c.slug === slug,
      )
    : undefined;

  return (
    <ProductListing
      title={q ? `Results for “${q}”` : "Search"}
      description={category ? `In ${category.name}` : undefined}
      scope={category ? { category: category.slug } : {}}
      eyebrow="Search"
      pathname="/search"
      searchParams={sp}
      showCategories={false}
      header={
        <div className="mb-8">
          <form action="/search" role="search" className="flex max-w-xl gap-2">
            {category && <input type="hidden" name="category" value={category.slug} />}
            <label htmlFor="search-q" className="sr-only">
              Search products
            </label>
            <Input
              id="search-q"
              name="q"
              type="search"
              defaultValue={q}
              placeholder="Search products, e.g. serum, sunscreen, vitamin C"
              autoFocus={!q}
              className="h-12 rounded-full px-5"
            />
            <Button type="submit" size="lg" pill>
              Search
            </Button>
          </form>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted">Popular:</span>
            {POPULAR_SEARCHES.map((s) => (
              <Link
                key={s}
                href={`/search?q=${encodeURIComponent(s)}`}
                className="border-line hover:border-brand-600 rounded-full border px-3 py-1"
              >
                {s}
              </Link>
            ))}
          </div>
        </div>
      }
    />
  );
}
