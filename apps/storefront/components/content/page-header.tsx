import type { ReactNode } from "react";

/** Soft banner with the page title, used by help and content pages. */
export function PageHeader({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow?: string;
  children?: ReactNode;
}) {
  return (
    <div className="bg-blush mb-10 rounded-3xl px-6 py-8 sm:px-10 sm:py-10">
      {eyebrow && (
        <p className="text-accent-700 text-xs font-semibold uppercase tracking-widest">{eyebrow}</p>
      )}
      <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h1>
      {children && <div className="text-muted mt-3">{children}</div>}
    </div>
  );
}
