"use client";

import { Dialog } from "@store/ui";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useMe } from "@/hooks/use-auth";
import { useUi } from "@/store/ui";
import { ChevronRightIcon, MenuIcon, PhoneIcon, PillIcon } from "../icons";
import { useSite } from "../site-context";
import type { NavData } from "./header";

export function MobileNavButton() {
  const setMenuOpen = useUi((s) => s.setMenuOpen);
  return (
    <button
      type="button"
      aria-label="Open menu"
      onClick={() => setMenuOpen(true)}
      className="hover:bg-surface -ml-2 rounded-full p-2 lg:hidden"
    >
      <MenuIcon />
    </button>
  );
}

const linkClass =
  "hover:bg-surface flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium";

export function MobileNav({ categories, collections }: NavData) {
  const { menuOpen, setMenuOpen } = useUi();
  const pathname = usePathname();
  const me = useMe();
  const { contact } = useSite();

  useEffect(() => setMenuOpen(false), [pathname, setMenuOpen]);

  return (
    <Dialog open={menuOpen} onClose={() => setMenuOpen(false)} title="Menu" variant="left">
      <nav aria-label="Mobile" className="space-y-6">
        <Link
          href="/prescription"
          className="bg-brand-700 flex items-center gap-3 rounded-2xl p-3 text-white"
        >
          <span className="grid size-9 place-items-center rounded-full bg-white/15">
            <PillIcon width={18} height={18} />
          </span>
          <span className="flex-1">
            <span className="block text-sm font-semibold">Upload a prescription</span>
            <span className="block text-xs text-white/75">Our pharmacist will call you</span>
          </span>
          <ChevronRightIcon />
        </Link>
        <div>
          <p className="text-muted px-3 pb-2 text-xs font-semibold uppercase tracking-wider">
            Categories
          </p>
          {categories.map((c) => (
            <Link key={c.id} href={`/categories/${c.slug}`} className={linkClass}>
              <span className="flex items-center gap-3">
                <span className="bg-surface relative size-9 overflow-hidden rounded-full">
                  {c.imageUrl && (
                    <Image src={c.imageUrl} alt="" fill sizes="36px" className="object-cover" />
                  )}
                </span>
                {c.name}
              </span>
              <ChevronRightIcon className="text-muted" />
            </Link>
          ))}
          <Link href="/shop" className={linkClass}>
            All products
            <ChevronRightIcon className="text-muted" />
          </Link>
        </div>
        <div>
          <p className="text-muted px-3 pb-2 text-xs font-semibold uppercase tracking-wider">
            Collections
          </p>
          <Link href="/offers" className={`${linkClass} text-accent-700`}>
            Offers
          </Link>
          {collections.map((c) => (
            <Link key={c.id} href={`/collections/${c.slug}`} className={linkClass}>
              {c.name}
            </Link>
          ))}
        </div>
        <div className="border-line border-t pt-4">
          <Link href={me.data ? "/account" : "/login"} className={linkClass}>
            {me.data ? "My account" : "Sign in / Create account"}
          </Link>
          <Link href="/track-order" className={linkClass}>
            Track your order
          </Link>
          <Link href="/faq" className={linkClass}>
            Help & FAQ
          </Link>
          <Link href="/contact" className={linkClass}>
            Contact us
          </Link>
          {contact.phone && (
            <a
              href={`tel:${contact.phone.replace(/\s/g, "")}`}
              className="text-brand-700 mt-2 flex items-center gap-2 px-3 py-2 text-sm font-semibold"
            >
              <PhoneIcon /> {contact.phone}
            </a>
          )}
        </div>
      </nav>
    </Dialog>
  );
}
