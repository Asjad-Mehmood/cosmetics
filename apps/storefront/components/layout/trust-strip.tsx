import { cn } from "@store/ui";
import { BadgeCheckIcon, CashIcon, RefreshIcon, TruckIcon } from "../icons";

export const TRUST_POINTS = [
  {
    icon: BadgeCheckIcon,
    title: "100% genuine",
    body: "From brands and authorised distributors only",
  },
  { icon: CashIcon, title: "Cash on Delivery", body: "Pay when your parcel arrives" },
  { icon: TruckIcon, title: "Fast delivery", body: "1-2 days in Lahore, 2-5 days nationwide" },
  { icon: RefreshIcon, title: "Easy returns", body: "Unopened items within 7 days" },
];

/** The four promises, as a row of icons. */
export function TrustStrip({ className }: { className?: string }) {
  return (
    <ul className={cn("grid grid-cols-2 gap-x-4 gap-y-6 lg:grid-cols-4", className)}>
      {TRUST_POINTS.map(({ icon: Icon, title, body }) => (
        <li key={title} className="flex items-start gap-3">
          <span className="bg-brand-50 text-brand-700 grid size-11 shrink-0 place-items-center rounded-full">
            <Icon />
          </span>
          <span>
            <span className="block text-sm font-semibold">{title}</span>
            <span className="text-muted block text-xs leading-snug sm:text-sm">{body}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
