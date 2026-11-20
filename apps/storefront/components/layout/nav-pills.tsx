"use client";

import type { CategoryDTO } from "@store/types";
import { cn } from "@store/ui";
import Link from "next/link";
import { usePathname } from "next/navigation";

const pill =
  "rounded-full px-4 py-1.5 text-[13px] font-semibold whitespace-nowrap transition-colors duration-200";

/** Category links in a white pill; the current page's link is a navy chip. */
export function NavPills({ categories }: { categories: CategoryDTO[] }) {
  const pathname = usePathname();
  const links = [
    ...categories.map((c) => ({ href: `/categories/${c.slug}`, label: c.name })),
    { href: "/collections/new-arrivals", label: "New arrivals" },
    { href: "/collections/best-sellers", label: "Best sellers" },
  ];
  return (
    <ul className="no-scrollbar border-line flex min-w-0 items-center gap-0.5 overflow-x-auto rounded-full border bg-white p-1 shadow-sm">
      {links.map(({ href, label }) => {
        const active = pathname === href;
        return (
          <li key={href}>
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                pill,
                active ? "bg-brand-600 text-white" : "text-ink/80 hover:bg-surface hover:text-ink",
              )}
            >
              {label}
            </Link>
          </li>
        );
      })}
      <li>
        <Link
          href="/offers"
          aria-current={pathname === "/offers" ? "page" : undefined}
          className={cn(
            pill,
            pathname === "/offers"
              ? "bg-accent-500 text-brand-700"
              : "text-accent-700 hover:bg-accent-50",
          )}
        >
          Offers
        </Link>
      </li>
    </ul>
  );
}
