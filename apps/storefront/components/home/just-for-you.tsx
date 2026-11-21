"use client";

import type { PaginatedResponse, ProductCardDTO } from "@store/types";
import { Button } from "@store/ui";
import { useInfiniteQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ProductCard } from "../product/product-card";

const PAGE = 10;

/** Daraz-style endless grid at the bottom of the home page, loaded a page at a time. */
export function JustForYou({ initial }: { initial: PaginatedResponse<ProductCardDTO> }) {
  const query = useInfiniteQuery({
    queryKey: ["just-for-you"],
    queryFn: ({ pageParam }) =>
      api<PaginatedResponse<ProductCardDTO>>(
        `/products?sort=top_rated&limit=${PAGE}&page=${pageParam}`,
      ),
    initialPageParam: 1,
    initialData: { pages: [initial], pageParams: [1] },
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
  });
  const products = query.data.pages.flatMap((p) => p.data);
  const total = query.data.pages[0]?.meta.total ?? products.length;
  if (!products.length) return null;

  return (
    <section aria-labelledby="for-you-heading">
      <h2 id="for-you-heading" data-gsap="split" className="mb-5 text-2xl font-bold tracking-tight">
        Just for you
      </h2>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
        {products.map((p) => (
          <li key={p.id}>
            <ProductCard product={p} />
          </li>
        ))}
      </ul>
      <div className="mt-8 flex flex-col items-center gap-2">
        <p className="text-muted text-sm" aria-live="polite">
          Showing {products.length} of {total}
        </p>
        {query.hasNextPage && (
          <Button
            variant="outline"
            pill
            size="lg"
            onClick={() => query.fetchNextPage()}
            loading={query.isFetchingNextPage}
          >
            Load more
          </Button>
        )}
      </div>
    </section>
  );
}
