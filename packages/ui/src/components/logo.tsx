import { cn } from "../lib/cn";

/*
 * The Amazon Group Pakistan logo is the client's own artwork, so it is used as
 * images (cut out of its background) rather than redrawn. The files live in the
 * storefront's public/brand folder; the full-size originals are in /brand.
 */

/** The "A" mark on its own. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <img
      src="/brand/logo-mark.png"
      alt=""
      width={300}
      height={256}
      className={cn("h-8 w-auto shrink-0", className)}
    />
  );
}

/**
 * The full logo: mark, "amazon" and "GROUP PAKISTAN". `onDark` uses the
 * version with white lettering. `label` adds a small suffix such as "Admin".
 */
export function Logo({
  className,
  imgClassName,
  label,
  onDark,
}: {
  className?: string;
  imgClassName?: string;
  label?: string;
  onDark?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <img
        src={onDark ? "/brand/logo-dark.png" : "/brand/logo.png"}
        alt="Amazon Group Pakistan"
        width={664}
        height={144}
        className={cn("h-9 w-auto shrink-0", imgClassName)}
      />
      {label && (
        <span
          className={cn(
            "whitespace-nowrap text-xs font-semibold",
            onDark ? "text-white/70" : "text-muted",
          )}
        >
          {label}
        </span>
      )}
    </span>
  );
}
