import type { OrderEventDTO, OrderStatus } from "@store/types";
import { ORDER_STATUS_LABEL } from "@store/types";
import { cn } from "@store/ui";

/** Returns happen after delivery, so those orders have completed every step. */
const AFTER_DELIVERY: OrderStatus[] = ["DELIVERED", "RETURN_REQUESTED", "RETURNED"];

const STEPS: { label: string; reached: OrderStatus[] }[] = [
  {
    label: "Confirmed",
    reached: ["CONFIRMED", "PAID", "PROCESSING", "SHIPPED", ...AFTER_DELIVERY],
  },
  { label: "Being prepared", reached: ["PROCESSING", "SHIPPED", ...AFTER_DELIVERY] },
  { label: "Shipped", reached: ["SHIPPED", ...AFTER_DELIVERY] },
  { label: "Delivered", reached: AFTER_DELIVERY },
];

/** Four-step progress bar for normal orders. */
export function OrderProgress({ status }: { status: OrderStatus }) {
  // Refunded orders may never have shipped, so the steps would mislead.
  if (status === "CANCELLED" || status === "PENDING_PAYMENT" || status === "REFUNDED") return null;
  return (
    <ol className="grid grid-cols-4 gap-2" aria-label="Order progress">
      {STEPS.map((step, i) => {
        const done = step.reached.includes(status);
        const current = done && STEPS.filter((s) => s.reached.includes(status)).at(-1) === step;
        return (
          <li key={step.label} aria-current={current ? "step" : undefined}>
            {/* Each finished step fills in turn; the current one pulses twice. */}
            <div className="bg-line relative h-1.5 overflow-hidden rounded-full">
              {done && (
                <span
                  className="bg-brand-600 animate-fill-x absolute inset-0 origin-left rounded-full"
                  style={{ animationDelay: `${150 + i * 250}ms` }}
                />
              )}
            </div>
            <p
              className={cn(
                "mt-2 flex items-center gap-1.5 text-xs sm:text-sm",
                done ? "font-medium" : "text-muted",
              )}
            >
              {current && (
                <span
                  aria-hidden
                  className="text-brand-600 animate-pulse-twice size-2 shrink-0 rounded-full bg-current"
                  style={{ animationDelay: `${400 + i * 250}ms` }}
                />
              )}
              {step.label}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

export function OrderTimeline({ events }: { events: OrderEventDTO[] }) {
  return (
    <ol className="border-line space-y-4 border-l pl-5">
      {[...events].reverse().map((e, i) => (
        <li key={`${e.at}-${i}`} className="relative">
          <span
            className={cn(
              "absolute -left-[25px] top-1.5 size-2.5 rounded-full",
              i === 0 ? "bg-ink" : "bg-line",
            )}
          />
          <p className="text-sm font-medium">{ORDER_STATUS_LABEL[e.status]}</p>
          {e.note && <p className="text-muted text-sm">{e.note}</p>}
          <time dateTime={e.at} className="text-muted text-xs">
            {new Date(e.at).toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" })}
          </time>
        </li>
      ))}
    </ol>
  );
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  const tone =
    status === "CANCELLED" || status === "REFUNDED"
      ? "bg-danger/10 text-danger"
      : status === "PENDING_PAYMENT"
        ? "bg-warning/20 text-ink"
        : status === "DELIVERED"
          ? "bg-success/10 text-success"
          : "bg-surface text-ink";
  return (
    <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", tone)}>
      {ORDER_STATUS_LABEL[status]}
    </span>
  );
}
