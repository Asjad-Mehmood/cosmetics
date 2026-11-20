"use client";

import type { ApiResponse, ProductCardDTO, ProductDetailDTO } from "@store/types";
import { Button } from "@store/ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useAddToCart } from "@/hooks/use-cart";
import { api, ApiError } from "@/lib/api";
import { useUi } from "@/store/ui";
import { BagIcon } from "../icons";

/** A product the card can add in one tap: one shade, one size in stock, one price. */
export const isSingleOption = (p: ProductCardDTO) =>
  p.inStock && p.colors.length <= 1 && p.sizesInStock.length === 1 && !p.hasPriceRange;

/**
 * The card's buy button. Single-option products go straight into the cart;
 * anything with a choice to make opens the product page.
 */
export function QuickAdd({ product }: { product: ProductCardDTO }) {
  const router = useRouter();
  const addToCart = useAddToCart();
  const openCart = useUi((s) => s.openCart);
  const [loading, setLoading] = useState(false);
  const href = `/products/${product.slug}`;
  const base = "w-full";

  if (!product.inStock) {
    return (
      <Link
        href={href}
        className="border-line text-muted hover:border-ink hover:text-ink flex h-10 w-full items-center justify-center rounded-full border text-sm font-medium"
        aria-label={`Notify me: ${product.title} is sold out`}
      >
        Notify me
      </Link>
    );
  }
  if (!isSingleOption(product)) {
    return (
      <Link
        href={href}
        className="border-brand-600 text-brand-700 hover:bg-brand-50 flex h-10 w-full items-center justify-center rounded-full border text-sm font-semibold"
        aria-label={`Choose options for ${product.title}`}
      >
        Choose options
      </Link>
    );
  }

  async function add() {
    setLoading(true);
    try {
      const detail = (await api<ApiResponse<ProductDetailDTO>>(href)).data;
      const available = detail.variants.filter((v) => v.stockStatus !== "out_of_stock");
      if (available.length !== 1) return router.push(href);
      await addToCart.mutateAsync({ variantId: available[0]!.id, quantity: 1 });
      openCart();
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Could not add to cart. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="brand"
      pill
      className={base}
      onClick={add}
      loading={loading}
      aria-label={`Add to cart: ${product.title}`}
    >
      {!loading && <BagIcon width={16} height={16} />}
      Add to cart
    </Button>
  );
}
