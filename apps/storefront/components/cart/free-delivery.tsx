"use client";

import { formatMoney } from "@store/types";
import { TruckIcon } from "../icons";
import { freeDeliveryFrom, useSite } from "../site-context";

/** "Add Rs X more for free delivery" with a progress bar. */
export function FreeDeliveryProgress({ subtotal }: { subtotal: number }) {
  const threshold = freeDeliveryFrom(useSite().delivery);
  if (threshold === null) return null;
  const left = Math.max(0, threshold - subtotal);
  const pct = Math.min(100, Math.round((subtotal / threshold) * 100));

  return (
    <div className="bg-mint rounded-2xl p-3.5" data-testid="free-delivery">
      <p className="flex items-center gap-2 text-sm">
        <TruckIcon width={18} height={18} className="text-brand-700 shrink-0" />
        {left > 0 ? (
          <span>
            Add <strong>{formatMoney(left)}</strong> more for <strong>free delivery</strong> in
            major cities
          </span>
        ) : (
          <span className="font-semibold">You&apos;ve unlocked free delivery in major cities!</span>
        )}
      </p>
      <div
        role="progressbar"
        aria-label="Progress to free delivery"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        className="mt-2.5 h-2 overflow-hidden rounded-full bg-white"
      >
        <div
          className="bg-brand-600 h-full rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
