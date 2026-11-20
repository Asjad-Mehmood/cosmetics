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
    <div className="bg-blush mb-10 rounded-[2rem] px-6 py-10 sm:px-12 sm:py-14">
      {eyebrow && <p className="eyebrow text-accent-700">{eyebrow}</p>}
      <h1 className="display mt-4 text-4xl sm:text-5xl">{title}</h1>
      {children && <div className="text-muted mt-3">{children}</div>}
    </div>
  );
}
