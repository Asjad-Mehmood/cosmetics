"use client";

import { cn } from "@store/ui";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMe } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { useUi } from "@/store/ui";
import { BagIcon, GridIcon, HomeIcon, SearchIcon, UserIcon } from "../icons";
import { focusSiteSearch } from "./search-box";

const item =
  "flex flex-1 flex-col items-center justify-center gap-0.5 pt-1.5 text-[11px] font-medium";

/** App-style tab bar on phones: Home, Categories, Search, Cart, Account. */
export function BottomNav() {
  const pathname = usePathname();
  const me = useMe();
  const count = useCart().data?.itemCount ?? 0;
  const { openCart, setMenuOpen } = useUi();
  const accountHref = me.data ? "/account" : "/login";
  const color = (on: boolean) => (on ? "text-brand-700" : "text-muted");

  return (
    <nav
      aria-label="Quick links"
      className="border-line bg-canvas/95 fixed inset-x-0 bottom-0 z-40 border-t pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <div className="flex h-14">
        <Link href="/" className={cn(item, color(pathname === "/"))}>
          <HomeIcon width={20} height={20} />
          Home
        </Link>
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          className={cn(item, color(pathname.startsWith("/categories")))}
        >
          <GridIcon width={20} height={20} />
          Categories
        </button>
        <button
          type="button"
          onClick={focusSiteSearch}
          className={cn(item, color(pathname.startsWith("/search")))}
        >
          <SearchIcon width={20} height={20} />
          Search
        </button>
        <button type="button" onClick={openCart} className={cn(item, "text-muted")}>
          <span className="relative">
            <BagIcon width={20} height={20} />
            {count > 0 && (
              <span className="bg-accent-700 absolute -right-2 -top-1 grid h-4 min-w-4 place-items-center rounded-full px-1 text-[9px] font-bold text-white">
                {count}
              </span>
            )}
          </span>
          Cart
        </button>
        <Link href={accountHref} className={cn(item, color(pathname.startsWith("/account")))}>
          <UserIcon width={20} height={20} />
          Account
        </Link>
      </div>
    </nav>
  );
}
