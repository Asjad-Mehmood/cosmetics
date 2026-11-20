"use client";

import { formatMoney } from "@store/types";
import { cn } from "@store/ui";
import { usePrevious } from "@/lib/motion";
import { CheckIcon, TruckIcon } from "../icons";
import { freeDeliveryFrom, useSite } from "../site-context";

/** "Add Rs X more for free delivery" with a progress bar. */
export function FreeDeliveryProgress({ subtotal }: { subtotal: number }) {
  const threshold = freeDeliveryFrom(useSite().delivery);
  const left = threshold === null ? 0 : Math.max(0, threshold - subtotal);
  // Celebrate only the moment it is unlocked, not every time the cart opens.
  const wasLocked = usePrevious(left > 0);
  if (threshold === null) return null;
  const pct = Math.min(100, Math.round((subtotal / threshold) * 100));
  const justUnlocked = left === 0 && wasLocked;

  return (
    <div className="bg-mint rounded-2xl p-3.5" data-testid="free-delivery">
      <p className="flex items-center gap-2 text-sm">
        {left > 0 ? (
          <TruckIcon width={18} height={18} className="text-brand-700 shrink-0" />
        ) : (
          <span className="bg-success animate-check-in grid size-[18px] shrink-0 place-items-center rounded-full text-white">
            <CheckIcon width={12} height={12} />
          </span>
        )}
        {left > 0 ? (
          <span>
            Add <strong>{formatMoney(left)}</strong> more for <strong>free delivery</strong> in
            major cities
          </span>
        ) : (
          <span key="unlocked" className="animate-fade-up font-semibold">
            You&apos;ve unlocked free delivery in major cities!
          </span>
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
          className={cn(
            "grow-x relative h-full overflow-hidden rounded-full",
            left > 0 ? "bg-brand-600" : "bg-success",
          )}
          style={{ width: `${pct}%` }}
        >
          {justUnlocked && (
            <span
              aria-hidden
              className="animate-bar-shine absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/80 to-transparent"
            />
          )}
        </div>
      </div>
    </div>
  );
}
