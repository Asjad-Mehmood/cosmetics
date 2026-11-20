"use client";

import { Card, Container, Skeleton } from "@store/ui";
import Link from "next/link";
import { useCart } from "@/hooks/use-cart";
import { TrustStrip } from "../layout/trust-strip";
import { CartLine } from "./cart-line";
import { FreeDeliveryProgress } from "./free-delivery";
import { CartSummary } from "./cart-summary";

export function CartPageContent() {
  const { data: cart, isLoading, isError, refetch } = useCart();

  return (
    <Container className="py-10 sm:py-14">
      <h1 className="text-3xl font-extrabold tracking-tight">Your cart</h1>

      {isLoading ? (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <Skeleton className="h-48" />
        </div>
      ) : isError ? (
        <div className="mt-8">
          <p>We couldn’t load your cart.</p>
          <button type="button" onClick={() => refetch()} className="mt-2 underline">
            Try again
          </button>
        </div>
      ) : !cart || cart.items.length === 0 ? (
        <div className="bg-blush mt-8 rounded-3xl px-6 py-20 text-center">
          <p className="text-lg font-semibold">Your cart is empty</p>
          <p className="text-muted mt-2 text-sm">Items you add will appear here.</p>
          <Link
            href="/shop"
            className="bg-brand-600 hover:bg-brand-700 mt-6 inline-flex h-12 items-center rounded-full px-7 text-sm font-semibold text-white"
          >
            Start shopping
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1fr_360px]">
          <section aria-label="Cart items">
            <FreeDeliveryProgress subtotal={cart.total} />
            {cart.warnings.length > 0 && (
              <ul
                role="alert"
                className="bg-danger/10 text-danger mt-4 space-y-1 rounded-xl p-4 text-sm"
              >
                {cart.warnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            )}
            <ul className="divide-line border-line mt-4 divide-y border-y">
              {cart.items.map((item) => (
                <CartLine key={item.id} item={item} />
              ))}
            </ul>
            <Link href="/shop" className="mt-6 inline-block text-sm font-medium underline">
              ← Continue shopping
            </Link>
          </section>
          <div className="space-y-4 lg:sticky lg:top-36">
            <Card className="rounded-3xl">
              <h2 className="mb-4 text-lg font-bold">Order summary</h2>
              <CartSummary cart={cart} showCoupon />
            </Card>
            <Card className="rounded-3xl">
              <TrustStrip className="grid-cols-1 gap-y-4 lg:grid-cols-1" />
            </Card>
          </div>
        </div>
      )}
    </Container>
  );
}
