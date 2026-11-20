"use client";

import { freeDeliveryFrom, useSite } from "../site-context";

/** Small "Free delivery" label for items that qualify on their own. */
export function FreeDeliveryTag({ price }: { price: number }) {
  const threshold = freeDeliveryFrom(useSite().delivery);
  if (threshold === null || price < threshold) return null;
  return (
    <span className="bg-mint text-brand-700 inline-block rounded-md px-1.5 py-0.5 text-[11px] font-semibold">
      Free delivery
    </span>
  );
}
