import { Container, Skeleton } from "@store/ui";
import type { ReactNode } from "react";
import { ListingSkeleton } from "@/components/shop/listing-skeleton";

/*
 * Placeholders shaped like each kind of shop page. Shown the instant a link is
 * clicked, until the new page arrives (see RouteView), so a page switch never
 * sits on the old page with no feedback.
 */

function Busy({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <Container className={className} aria-busy="true" aria-label="Loading">
      {children}
    </Container>
  );
}

function CardRow({ count = 5 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={i >= 2 ? "hidden sm:block" : undefined}>
          <Skeleton className="aspect-[4/5] rounded-xl" />
          <Skeleton className="mt-3 h-4 w-3/4" />
          <Skeleton className="mt-2 h-4 w-1/3" />
        </div>
      ))}
    </div>
  );
}

export function HomeSkeleton() {
  return (
    <Busy className="pt-4 sm:pt-6">
      <Skeleton className="h-[340px] rounded-3xl sm:h-[400px] lg:h-[460px]" />
      <div className="mt-12 flex gap-4 overflow-hidden sm:grid sm:grid-cols-5 sm:gap-6">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="w-24 shrink-0 sm:w-auto">
            <Skeleton className="mx-auto aspect-square w-full rounded-full sm:w-36" />
            <Skeleton className="mx-auto mt-3 h-4 w-2/3" />
          </div>
        ))}
      </div>
      <Skeleton className="mb-6 mt-14 h-7 w-48" />
      <CardRow />
    </Busy>
  );
}

export function ProductSkeleton() {
  return (
    <Busy className="pb-8 pt-4 sm:py-8">
      <Skeleton className="mb-6 hidden h-4 w-64 sm:block" />
      <div className="grid gap-8 md:grid-cols-2 lg:gap-14">
        <Skeleton className="-mx-4 aspect-square rounded-none sm:mx-0 sm:rounded-2xl" />
        <div>
          <Skeleton className="h-4 w-24" />
          <Skeleton className="mt-3 h-9 w-4/5" />
          <Skeleton className="mt-3 h-4 w-40" />
          <Skeleton className="mt-6 h-8 w-32" />
          <Skeleton className="mt-8 h-4 w-20" />
          <div className="mt-3 flex gap-2">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-10 w-16 rounded-full" />
            ))}
          </div>
          <Skeleton className="mt-8 h-12 w-full rounded-full" />
          <Skeleton className="mt-3 h-12 w-full rounded-full" />
          <Skeleton className="mt-8 h-24 w-full rounded-2xl" />
        </div>
      </div>
    </Busy>
  );
}

export function CartSkeleton() {
  return (
    <Busy className="py-10 sm:py-14">
      <Skeleton className="h-9 w-48" />
      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="border-line flex gap-4 rounded-2xl border p-4">
              <Skeleton className="size-24 shrink-0 rounded-xl" />
              <div className="flex-1">
                <Skeleton className="h-4 w-3/5" />
                <Skeleton className="mt-2 h-4 w-1/4" />
                <Skeleton className="mt-6 h-9 w-28 rounded-full" />
              </div>
            </div>
          ))}
        </div>
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    </Busy>
  );
}

export function AccountSkeleton() {
  return (
    <Busy className="py-10 sm:py-14">
      <Skeleton className="h-9 w-56" />
      <div className="mt-8 grid gap-8 lg:grid-cols-[220px_1fr]">
        <div className="hidden space-y-3 lg:block">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
        <div className="space-y-4">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      </div>
    </Busy>
  );
}

export function ContentSkeleton() {
  return (
    <Busy className="py-10 sm:py-14">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="mt-3 h-10 w-2/3 max-w-xl" />
      <div className="mt-10 max-w-3xl space-y-3">
        {Array.from({ length: 7 }, (_, i) => (
          <Skeleton key={i} className={i % 3 === 2 ? "h-4 w-2/3" : "h-4 w-full"} />
        ))}
      </div>
    </Busy>
  );
}

/** The placeholder for a shop path. */
export function skeletonFor(pathname: string): ReactNode {
  if (pathname === "/") return <HomeSkeleton />;
  if (pathname.startsWith("/products/")) return <ProductSkeleton />;
  if (/^\/(shop|search|offers)(\/|$)|^\/(categories|collections)\//.test(pathname)) {
    return <ListingSkeleton />;
  }
  if (pathname === "/cart") return <CartSkeleton />;
  if (/^\/(account|orders|checkout|track-order)(\/|$)/.test(pathname)) return <AccountSkeleton />;
  return <ContentSkeleton />;
}
