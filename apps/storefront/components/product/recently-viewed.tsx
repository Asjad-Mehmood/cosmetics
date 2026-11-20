"use client";

import type { PaginatedResponse, ProductCardDTO } from "@store/types";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { readRecentlyViewed, rememberViewed } from "@/lib/recently-viewed";
import { ProductRail } from "./product-rail";

/**
 * "Recently viewed" strip. Records `current` (a product page) and shows the
 * other products this browser looked at, newest first.
 */
export function RecentlyViewed({ current }: { current?: string }) {
  const [slugs, setSlugs] = useState<string[]>([]);
  useEffect(() => {
    const all = current ? rememberViewed(current) : readRecentlyViewed();
    setSlugs(all.filter((s) => s !== current).slice(0, 8));
  }, [current]);

  const products = useQuery({
    queryKey: ["recently-viewed", slugs],
    queryFn: () =>
      api<PaginatedResponse<ProductCardDTO>>(`/products?slugs=${slugs.join(",")}&limit=8`),
    enabled: slugs.length > 0,
    staleTime: 60_000,
  });
  const items = products.data?.data ?? [];
  if (!items.length) return null;

  return (
    <div className="mt-16">
      <ProductRail eyebrow="Pick up where you left off" title="Recently viewed" products={items} />
    </div>
  );
}
