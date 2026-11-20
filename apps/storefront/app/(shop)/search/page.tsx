import { Button, Input } from "@store/ui";
import type { Metadata } from "next";
import { ProductListing } from "@/components/shop/product-listing";
import type { SearchParams } from "@/lib/listing";

export const metadata: Metadata = { title: "Search", robots: { index: false } };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";

  return (
    <ProductListing
      title={q ? `Results for “${q}”` : "Search"}
      pathname="/search"
      searchParams={sp}
      header={
        <form action="/search" role="search" className="mb-10 flex max-w-xl gap-2">
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
          />
          <Button type="submit">Search</Button>
        </form>
      }
    />
  );
}
