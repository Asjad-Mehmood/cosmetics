import type { HTMLAttributes } from "react";
import { cn } from "../lib/cn";

/**
 * Placeholder block shown while content loads: a soft highlight sweeps across
 * it (a still block under "Reduce motion").
 */
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden
      className={cn(
        "animate-shimmer rounded-lg bg-[linear-gradient(90deg,var(--color-line)_25%,var(--color-surface)_50%,var(--color-line)_75%)] bg-[length:200%_100%]",
        className,
      )}
      {...props}
    />
  );
}
