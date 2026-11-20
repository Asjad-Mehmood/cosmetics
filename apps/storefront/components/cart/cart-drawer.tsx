"use client";

import { Dialog, Skeleton } from "@store/ui";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useCart } from "@/hooks/use-cart";
import { useUi } from "@/store/ui";
import { useSite } from "../site-context";
import { CartLine } from "./cart-line";
import { FreeDeliveryProgress } from "./free-delivery";
import { CartSummary } from "./cart-summary";

export function CartDrawer() {
  const { cartOpen, closeCart } = useUi();
  const { data: cart, isLoading } = useCart();
  const pathname = usePathname();
  const { categories } = useSite();

  useEffect(() => closeCart(), [pathname, closeCart]);

  const count = cart?.itemCount ?? 0;
  return (
    <Dialog
      open={cartOpen}
      onClose={closeCart}
      variant="right"
      title={`Your cart${count ? ` (${count})` : ""}`}
      footer={
        cart && cart.items.length > 0 ? (
          <div className="space-y-3">
            <CartSummary cart={cart} />
            <Link
              href="/cart"
              className="hover:text-brand-700 block text-center text-sm font-semibold underline"
            >
              View full cart
            </Link>
          </div>
        ) : undefined
      }
    >
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      ) : !cart || cart.items.length === 0 ? (
        <div className="py-12 text-center">
          <span className="bg-blush text-accent-700 mx-auto grid size-16 place-items-center rounded-full">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden
            >
              <path d="M5 8h14l-1 13H6L5 8Z" />
              <path d="M9 8V6a3 3 0 0 1 6 0v2" />
            </svg>
          </span>
          <p className="mt-4 font-semibold">Your cart is empty</p>
          <p className="text-muted mt-1 text-sm">Find your next favourite.</p>
          <Link
            href="/shop"
            className="bg-brand-600 hover:bg-brand-700 mt-6 inline-flex h-11 items-center rounded-full px-6 text-sm font-semibold text-white"
          >
            Shop products
          </Link>
          {categories.length > 0 && (
            <ul className="mt-8 flex flex-wrap justify-center gap-2">
              {categories.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/categories/${c.slug}`}
                    className="border-line hover:border-brand-600 block rounded-full border px-3 py-1.5 text-xs font-medium"
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <>
          <FreeDeliveryProgress subtotal={cart.total} />
          {cart.warnings.length > 0 && (
            <div role="alert" className="bg-danger/10 text-danger mt-3 rounded-xl p-3 text-sm">
              Some items need your attention before checkout.
            </div>
          )}
          <ul className="divide-line divide-y">
            {cart.items.map((item) => (
              <CartLine key={item.id} item={item} compact />
            ))}
          </ul>
        </>
      )}
    </Dialog>
  );
}
