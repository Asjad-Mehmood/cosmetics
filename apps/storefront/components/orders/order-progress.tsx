import type { ReactNode } from "react";
import type { OrderEventDTO, OrderStatus } from "@store/types";
import { ORDER_STATUS_LABEL } from "@store/types";
import { cn } from "@store/ui";
import { BadgeCheckIcon, CheckIcon, ClockIcon, HomeIcon, TruckIcon } from "../icons";

/** Returns happen after delivery, so those orders have completed every step. */
const AFTER_DELIVERY: OrderStatus[] = ["DELIVERED", "RETURN_REQUESTED", "RETURNED"];
const WITH_COURIER: OrderStatus[] = ["SHIPPED", "IN_TRANSIT", "OUT_FOR_DELIVERY"];

const BoxIcon = (p: { width?: number; height?: number }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden {...p}>
    <path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5v-9Z" strokeLinejoin="round" />
    <path d="M3 7.5 12 12l9-4.5M12 12v9" strokeLinejoin="round" />
  </svg>
);

/**
 * The delivery journey, step by step. `statuses` are the order statuses that
 * complete the step; the step's time is the first of them in the history.
 */
const STEPS: {
  label: string;
  hint: string;
  icon: (p: { width?: number; height?: number }) => ReactNode;
  statuses: OrderStatus[];
}[] = [
  {
    label: "Order confirmed",
    hint: "We have your order",
    icon: BadgeCheckIcon,
    statuses: ["CONFIRMED", "PAID"],
  },
  {
    label: "Being prepared",
    hint: "Picking and checking your items",
    icon: ClockIcon,
    statuses: ["PROCESSING"],
  },
  { label: "Packed", hint: "Sealed and labelled", icon: BoxIcon, statuses: ["PACKED"] },
  {
    label: "Shipped",
    hint: "Handed to the courier",
    icon: TruckIcon,
    statuses: ["SHIPPED", "IN_TRANSIT"],
  },
  {
    label: "Out for delivery",
    hint: "With the rider, arriving today",
    icon: TruckIcon,
    statuses: ["OUT_FOR_DELIVERY"],
  },
  { label: "Delivered", hint: "Enjoy!", icon: HomeIcon, statuses: AFTER_DELIVERY },
];

/** How far along the journey a status is (index of the last step it completes). */
function stepIndex(status: OrderStatus): number {
  if (AFTER_DELIVERY.includes(status)) return 5;
  if (status === "OUT_FOR_DELIVERY") return 4;
  if (WITH_COURIER.includes(status)) return 3;
  if (status === "PACKED") return 2;
  if (status === "PROCESSING") return 1;
  return 0;
}

const when = (at: string) =>
  new Date(at).toLocaleString("en-PK", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });

/**
 * Six-step tracker: confirmed → prepared → packed → shipped → out for delivery
 * → delivered, with the time each step happened. Vertical on phones,
 * horizontal on wider screens. Steps staff skipped show as done, without a time.
 */
export function OrderProgress({
  status,
  events = [],
}: {
  status: OrderStatus;
  events?: OrderEventDTO[];
}) {
  // Refunded orders may never have shipped, so the steps would mislead.
  if (status === "CANCELLED" || status === "PENDING_PAYMENT" || status === "REFUNDED") return null;
  const reached = stepIndex(status);

  return (
    <ol aria-label="Order progress" className="grid gap-0 sm:grid-cols-6 sm:gap-2">
      {STEPS.map((step, i) => {
        const done = i <= reached;
        const current = i === reached;
        const at = events.find((e) => step.statuses.includes(e.status))?.at;
        const label = current && status === "IN_TRANSIT" ? "In transit" : step.label;
        const Icon = step.icon;
        return (
          <li
            key={step.label}
            aria-current={current ? "step" : undefined}
            className="relative flex gap-3 pb-5 last:pb-0 sm:block sm:pb-0"
          >
            {/* The line to the next step: down on phones, across on wider screens. */}
            {i < STEPS.length - 1 && (
              <span
                aria-hidden
                className="bg-line absolute left-[17px] top-9 h-[calc(100%-2.25rem)] w-0.5 overflow-hidden rounded-full sm:left-[calc(50%+1.25rem)] sm:top-[17px] sm:h-0.5 sm:w-[calc(100%-2rem)]"
              >
                {i < reached && (
                  <span
                    className="bg-brand-600 animate-fill-x absolute inset-0 origin-left rounded-full max-sm:origin-top"
                    style={{ animationDelay: `${150 + i * 180}ms` }}
                  />
                )}
              </span>
            )}
            <span
              className={cn(
                "relative z-10 grid size-9 shrink-0 place-items-center rounded-full border-2 transition sm:mx-auto",
                current
                  ? "border-brand-600 bg-brand-600 text-white shadow-[0_0_0_5px_color-mix(in_oklab,var(--color-brand-600)_15%,transparent)]"
                  : done
                    ? "border-brand-600 bg-brand-50 text-brand-700"
                    : "border-line bg-canvas text-muted",
              )}
            >
              {done && !current ? (
                <CheckIcon width={16} height={16} />
              ) : (
                <Icon width={16} height={16} />
              )}
            </span>
            <div className="min-w-0 sm:mt-2 sm:text-center">
              <p
                className={cn(
                  "flex items-center gap-1.5 text-sm sm:justify-center",
                  done ? "font-semibold" : "text-muted",
                )}
              >
                {current && (
                  <span
                    aria-hidden
                    className="text-brand-600 animate-pulse-twice size-2 shrink-0 rounded-full bg-current sm:hidden"
                  />
                )}
                {label}
                {done && <span className="sr-only"> (done)</span>}
              </p>
              <p className="text-muted text-xs">
                {at ? <time dateTime={at}>{when(at)}</time> : current || !done ? step.hint : null}
              </p>
            </div>
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
          : status === "OUT_FOR_DELIVERY"
            ? "bg-accent-50 text-accent-700"
            : "bg-surface text-ink";
  return (
    <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", tone)}>
      {ORDER_STATUS_LABEL[status]}
    </span>
  );
}
