import type { SVGProps } from "react";
import { cn } from "../lib/cn";

/** Amazon Group mark: a care droplet with a rose plus, on a deep teal tile. */
export function LogoMark({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn("size-8 shrink-0", className)} {...props}>
      <rect width="32" height="32" rx="8" fill="#0f5e63" />
      <path d="M16 4.5S7.5 13.4 7.5 19.3a8.5 8.5 0 0 0 17 0C24.5 13.4 16 4.5 16 4.5Z" fill="#fff" />
      <path
        d="M16 15.3v7.6M12.2 19.1h7.6"
        stroke="#e0697e"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Mark + "Amazon Group" wordmark. `label` adds a small suffix such as "Admin". */
export function Logo({
  className,
  label,
  markClassName,
}: {
  className?: string;
  label?: string;
  markClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark className={markClassName} />
      <span className="whitespace-nowrap text-lg font-extrabold leading-none tracking-tight">
        Amazon <span className="text-brand-600">Group</span>
        {label && (
          <span className="text-muted ml-1.5 text-xs font-semibold tracking-normal">{label}</span>
        )}
      </span>
    </span>
  );
}
