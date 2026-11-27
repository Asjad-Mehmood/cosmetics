"use client";

import type { ApiResponse, ProductCardDTO, ProductDetailDTO } from "@store/types";
import { Button, cn } from "@store/ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type MouseEvent, useState } from "react";
import { toast } from "sonner";
import { useAddToCart } from "@/hooks/use-cart";
import { api, ApiError } from "@/lib/api";
import { flyToCart, useFlash } from "@/lib/motion";
import { useUi } from "@/store/ui";
import { BagIcon, CheckIcon } from "../icons";

/** A product the card can add in one tap: one shade, one size in stock, one price. */
export const isSingleOption = (p: ProductCardDTO) =>
  p.inStock && p.colors.length <= 1 && p.sizesInStock.length === 1 && !p.hasPriceRange;

/**
 * The card's buy button. Single-option products go straight into the cart;
 * anything with a choice to make opens the product page.
 */
export function QuickAdd({
  product,
  overlay = false,
}: {
  product: ProductCardDTO;
  /** The button that sits on the card's photo in the minimal design. */
  overlay?: boolean;
}) {
  const router = useRouter();
  const addToCart = useAddToCart();
  const openCart = useUi((s) => s.openCart);
  const [loading, setLoading] = useState(false);
  const [added, flashAdded] = useFlash();
  const href = `/products/${product.slug}`;
  const base = "w-full";

  if (overlay && !product.inStock) {
    return (
      <OverlayButton
        href={href}
        label="Notify me"
        aria-label={`Notify me: ${product.title} is sold out`}
      />
    );
  }
  if (overlay && !isSingleOption(product)) {
    return (
      <OverlayButton
        href={href}
        label="Choose options"
        aria-label={`Choose options for ${product.title}`}
      />
    );
  }
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

  async function add(e: MouseEvent<HTMLButtonElement>) {
    // The card's photo, to fly into the cart icon.
    const photo = e.currentTarget.closest("article")?.querySelector("img");
    setLoading(true);
    try {
      const detail = (await api<ApiResponse<ProductDetailDTO>>(href)).data;
      const available = detail.variants.filter((v) => v.stockStatus !== "out_of_stock");
      if (available.length !== 1) return router.push(href);
      await addToCart.mutateAsync({ variantId: available[0]!.id, quantity: 1 });
      setLoading(false);
      flashAdded();
      await flyToCart(photo, photo?.currentSrc);
      openCart();
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Could not add to cart. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (overlay) {
    return (
      <OverlayButton
        onClick={add}
        disabled={loading}
        label={added ? "Added" : loading ? "Adding…" : "Add to cart"}
        aria-label={`Add to cart: ${product.title}`}
      />
    );
  }

  return (
    <Button
      variant="brand"
      pill
      className={cn(base, added && "bg-success hover:bg-success")}
      onClick={add}
      loading={loading}
      aria-label={`Add to cart: ${product.title}`}
    >
      {added ? (
        <span className="animate-check-in inline-flex items-center gap-1.5">
          <CheckIcon width={16} height={16} /> Added
        </span>
      ) : (
        <>
          {!loading && <BagIcon width={16} height={16} />}
          Add to cart
        </>
      )}
    </Button>
  );
}

/**
 * The photo's buy button: a white pill that fills black from the left on hover
 * (a round bag icon on phones). A link when there are options to choose.
 */
function OverlayButton({
  href,
  label,
  onClick,
  disabled,
  "aria-label": ariaLabel,
}: {
  href?: string;
  label: string;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  "aria-label": string;
}) {
  const content = (
    <>
      <BagIcon width={18} height={18} data-overlay-icon aria-hidden />
      <span data-overlay-label>{label}</span>
    </>
  );
  const className = "sweep-btn";
  return href ? (
    <Link href={href} data-overlay-btn className={className} aria-label={ariaLabel}>
      {content}
    </Link>
  ) : (
    <button
      type="button"
      data-overlay-btn
      className={className}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      {content}
    </button>
  );
}
