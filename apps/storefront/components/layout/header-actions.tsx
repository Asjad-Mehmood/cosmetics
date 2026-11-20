"use client";

import { formatMoney } from "@store/types";
import Link from "next/link";
import { useMe } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { useWishlistIds } from "@/hooks/use-wishlist";
import { useUi } from "@/store/ui";
import { BagIcon, HeartIcon, UserIcon } from "../icons";

const Count = ({ n, testId }: { n: number; testId?: string }) => (
  <span
    data-testid={testId}
    className="bg-accent-500 text-brand-700 absolute -right-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full px-1 text-[10px] font-extrabold ring-2 ring-white"
  >
    {n > 99 ? "99+" : n}
  </span>
);

export function HeaderActions() {
  const me = useMe();
  const cart = useCart();
  const openCart = useUi((s) => s.openCart);
  const count = cart.data?.itemCount ?? 0;
  const saved = useWishlistIds().data?.length ?? 0;
  const firstName = me.data?.name.split(" ")[0];

  return (
    <div className="ml-auto flex items-center gap-1 sm:gap-2">
      <Link
        href={me.data ? "/account" : "/login"}
        className="hover:bg-surface hidden items-center gap-2.5 rounded-full p-2 sm:flex lg:pr-3"
      >
        <UserIcon />
        <span className="sr-only lg:hidden">{me.data ? "My account" : "Sign in"}</span>
        <span className="hidden text-left leading-tight lg:block">
          <span className="text-muted block text-[11px]">
            {firstName ? `Hi, ${firstName}` : "Welcome"}{" "}
          </span>
          <span className="block text-sm font-semibold">{me.data ? "My account" : "Sign in"}</span>
        </span>
      </Link>
      <Link
        href={me.data ? "/account/wishlist" : "/login?next=%2Faccount%2Fwishlist"}
        aria-label={`Wishlist${saved ? `, ${saved} saved` : ""}`}
        className="hover:bg-surface relative hidden rounded-full p-2 sm:block"
      >
        <HeartIcon />
        {saved > 0 && <Count n={saved} />}
      </Link>
      <button
        type="button"
        onClick={openCart}
        className="hover:bg-surface lg:bg-brand-600 lg:hover:bg-brand-700 flex items-center gap-2.5 rounded-full p-2 transition-colors lg:py-1.5 lg:pl-3 lg:pr-5 lg:text-white"
      >
        <span className="relative">
          <BagIcon />
          {count > 0 && <Count n={count} testId="cart-count" />}
        </span>
        <span className="sr-only lg:hidden">Cart</span>
        <span className="hidden text-left leading-tight lg:block">
          <span className="block text-[11px] text-white/70">Cart </span>
          <span className="block text-sm font-semibold">{formatMoney(cart.data?.total ?? 0)}</span>
        </span>
        <span className="sr-only">
          , {count} {count === 1 ? "item" : "items"}, open cart
        </span>
      </button>
    </div>
  );
}
