"use client";

import type { ApiResponse, ProductCardDTO } from "@store/types";
import { useQuery } from "@tanstack/react-query";
import { useMe } from "@/hooks/use-auth";
import { api } from "@/lib/api";
import { ProductRail } from "../product/product-rail";

/** Signed-in shoppers: products from their earlier orders, one tap from the cart. */
export function BuyAgain() {
  const me = useMe();
  const products = useQuery({
    queryKey: ["buy-again", me.data?.id],
    queryFn: async () => (await api<ApiResponse<ProductCardDTO[]>>("/me/orders/products")).data,
    enabled: !!me.data,
    staleTime: 60_000,
  });
  if (!products.data?.length) return null;
  return (
    <div className="pt-14">
      <ProductRail
        eyebrow="Your favourites"
        title="Buy it again"
        subtitle="Restock your favourites from earlier orders"
        products={products.data}
        href="/account/orders"
        linkLabel="Your orders"
      />
    </div>
  );
}
