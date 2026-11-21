"use client";

import type { AppliedCouponDTO } from "@store/types";
import { formatMoney } from "@store/types";
import { Button, cn, Input } from "@store/ui";
import { useRef, useState } from "react";
import { useApplyCoupon, useRemoveCoupon } from "@/hooks/use-cart";
import { ApiError } from "@/lib/api";
import { shake } from "@/lib/motion";
import { DrawnCheck } from "../motion";

/** Discount code entry, or the applied code with a remove button. */
export function CouponForm({
  coupon,
  onChange,
}: {
  coupon: AppliedCouponDTO | null;
  onChange?: () => void;
}) {
  const apply = useApplyCoupon();
  const remove = useRemoveCoupon();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const row = useRef<HTMLDivElement>(null);
  const [justApplied, setJustApplied] = useState(false);

  if (coupon) {
    return (
      <div
        className={cn(
          "bg-surface flex items-start justify-between gap-3 rounded-lg p-3 text-sm",
          justApplied && "animate-fade-up",
        )}
      >
        {justApplied && coupon.isValid && <DrawnCheck className="text-success size-6 shrink-0" />}
        <div className="flex-1">
          <p className="font-semibold">
            {coupon.code}
            {coupon.isValid && coupon.discount > 0 && (
              <span className="text-success font-normal"> · −{formatMoney(coupon.discount)}</span>
            )}
          </p>
          <p className={coupon.isValid ? "text-muted text-xs" : "text-danger text-xs"}>
            {coupon.isValid ? coupon.description : coupon.message}
          </p>
        </div>
        <button
          type="button"
          className="text-muted hover:text-ink text-xs underline"
          onClick={() =>
            remove.mutate(undefined, {
              onSuccess: () => {
                setJustApplied(false);
                onChange?.();
              },
            })
          }
          disabled={remove.isPending}
        >
          Remove
        </button>
      </div>
    );
  }

  const submit = () => {
    if (!code.trim()) return;
    setError(null);
    apply.mutate(code.trim(), {
      onSuccess: () => {
        setCode("");
        setJustApplied(true);
        onChange?.();
      },
      onError: (err) => {
        setError(err instanceof ApiError ? err.message : "Could not apply the code");
        shake(row.current);
      },
    });
  };

  // Not a <form>: this box also appears inside the checkout form, and nested
  // forms are invalid HTML (the inner submit would also submit the checkout).
  return (
    <div className="space-y-1.5">
      <label htmlFor="coupon-code" className="text-sm font-medium">
        Discount code
      </label>
      <div ref={row} className="flex gap-2">
        <Input
          id="coupon-code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="e.g. WELCOME10"
          autoComplete="off"
          invalid={!!error}
          aria-describedby={error ? "coupon-error" : undefined}
        />
        <Button type="button" variant="outline" loading={apply.isPending} onClick={submit}>
          Apply
        </Button>
      </div>
      {error && (
        <p id="coupon-error" role="alert" className="text-danger animate-fade-in text-sm">
          {error}
        </p>
      )}
    </div>
  );
}
