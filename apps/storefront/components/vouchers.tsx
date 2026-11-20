"use client";

import type { VoucherDTO } from "@store/types";
import { formatMoney } from "@store/types";
import { cn } from "@store/ui";
import { useState } from "react";
import { toast } from "sonner";
import { useApplyCoupon, useCart } from "@/hooks/use-cart";
import { ApiError } from "@/lib/api";
import { CheckIcon } from "./icons";
import { useSite } from "./site-context";

export const voucherTitle = (v: VoucherDTO) =>
  v.type === "PERCENTAGE"
    ? `${v.value}% off`
    : v.type === "FIXED"
      ? `${formatMoney(v.value)} off`
      : "Free delivery";

export const voucherCondition = (v: VoucherDTO) =>
  v.minOrderAmount ? `On orders over ${formatMoney(v.minOrderAmount)}` : "No minimum order";

/** One voucher "ticket": the deal, its condition, and a copy or apply button. */
function VoucherTicket({ v, mode }: { v: VoucherDTO; mode: "copy" | "apply" }) {
  const [copied, setCopied] = useState(false);
  const apply = useApplyCoupon();
  const applied = useCart().data?.coupon?.code === v.code;

  const onClick = async () => {
    if (mode === "apply") {
      apply.mutate(v.code, {
        onSuccess: () => toast.success(`${v.code} applied`),
        onError: (err) =>
          toast.error(err instanceof ApiError ? err.message : "Could not apply the code"),
      });
      return;
    }
    try {
      await navigator.clipboard.writeText(v.code);
      setCopied(true);
      toast.success(`Copied ${v.code}. Paste it at checkout.`);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast(`Use code ${v.code} at checkout`);
    }
  };

  const done = mode === "apply" ? applied : copied;
  return (
    <div className="border-accent-100 bg-canvas relative flex min-w-60 items-stretch overflow-hidden rounded-2xl border">
      <div className="bg-accent-50 flex flex-1 flex-col justify-center px-4 py-3">
        <p className="text-accent-700 text-lg font-extrabold leading-tight">{voucherTitle(v)}</p>
        <p className="text-muted text-xs">{voucherCondition(v)}</p>
        <p className="mt-1 font-mono text-xs font-semibold tracking-wider">{v.code}</p>
      </div>
      {/* Ticket notch */}
      <span aria-hidden className="border-accent-100 border-l-2 border-dashed" />
      <div className="grid place-items-center px-3">
        <button
          type="button"
          onClick={onClick}
          disabled={apply.isPending || (mode === "apply" && applied)}
          aria-label={`${mode === "apply" ? "Apply" : "Copy"} voucher ${v.code}`}
          className={cn(
            "flex h-9 items-center gap-1 rounded-full px-4 text-xs font-bold transition",
            done ? "bg-success/10 text-success" : "bg-accent-700 hover:bg-accent-700/90 text-white",
          )}
        >
          {done && <CheckIcon width={14} height={14} />}
          {mode === "apply" ? (applied ? "Applied" : "Apply") : copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}

/** Daraz-style "collect vouchers" row. `apply` puts the code straight into the cart. */
export function VoucherStrip({
  title = "Vouchers for you",
  mode = "copy",
  className,
}: {
  title?: string;
  mode?: "copy" | "apply";
  className?: string;
}) {
  const { vouchers } = useSite();
  if (!vouchers.length) return null;
  return (
    <section aria-label={title} className={className}>
      <p className="mb-3 text-sm font-bold">{title}</p>
      <ul className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        {vouchers.map((v) => (
          <li key={v.code} className="shrink-0">
            <VoucherTicket v={v} mode={mode} />
          </li>
        ))}
      </ul>
    </section>
  );
}
