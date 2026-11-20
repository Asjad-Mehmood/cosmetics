import type { ButtonHTMLAttributes } from "react";
import { cn } from "../lib/cn";

const variants = {
  primary: "bg-ink text-white hover:bg-ink/85",
  brand: "bg-brand-600 text-white hover:bg-brand-700",
  accent: "bg-accent-700 text-white hover:bg-accent-700/90",
  /** Bright gold with navy text, for dark (navy) sections. */
  gold: "bg-accent-500 text-brand-700 font-bold hover:brightness-105",
  outline: "border border-line bg-canvas text-ink hover:bg-surface",
  ghost: "text-ink hover:bg-surface",
  danger: "bg-danger text-white hover:bg-danger/90",
} as const;

const sizes = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
  icon: "size-10",
} as const;

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  loading?: boolean;
  /** Fully rounded ends (the storefront's style). */
  pill?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  pill = false,
  className,
  disabled,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-semibold transition-[color,background-color,filter,translate] duration-200 active:translate-y-px",
        pill ? "rounded-full" : "rounded-lg",
        "focus-visible:ring-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading && (
        <span
          aria-hidden
          className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      {children}
    </button>
  );
}
