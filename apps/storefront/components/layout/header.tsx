import type { CategoryDTO, CollectionDTO } from "@store/types";
import { Container, Logo } from "@store/ui";
import Link from "next/link";
import { siteConfig } from "@/lib/config";
import { PhoneIcon } from "../icons";
import { HeaderActions } from "./header-actions";
import { MegaMenu } from "./mega-menu";
import { MobileNav, MobileNavButton } from "./mobile-nav";
import { NavPills } from "./nav-pills";
import { SearchBar } from "./search-box";

export interface NavData {
  categories: CategoryDTO[];
  collections: CollectionDTO[];
}

/**
 * Sticky header floating over the page as a frosted-glass pill: logo, search,
 * account and cart; below it on wide screens, the categories as a pill menu.
 * On phones the search box sits under the pill and scrolls away with the page
 * (the bottom tab bar's Search button brings it back).
 */
export function Header({ categories, collections }: NavData) {
  return (
    <>
      <header className="pointer-events-none sticky top-0 z-40 pt-2 sm:pt-3">
        <Container className="relative">
          <div className="pointer-events-auto flex h-14 items-center gap-2 rounded-full border border-white/70 bg-white/80 pl-2 pr-1.5 shadow-[0_10px_30px_-12px_rgb(10_17_40/0.25)] backdrop-blur-xl sm:h-16 sm:gap-3 sm:pl-4 lg:gap-6">
            <MobileNavButton />
            <Link href="/" aria-label={`${siteConfig.name} home`} className="shrink-0">
              <Logo markClassName="size-8" />
            </Link>
            <div className="hidden flex-1 md:block">
              <SearchBar />
            </div>
            <HeaderActions />
          </div>

          <nav
            aria-label="Main"
            className="pointer-events-auto mt-2 hidden items-center justify-center gap-2 lg:flex"
          >
            <MegaMenu categories={categories} collections={collections} />
            <NavPills categories={categories} />
          </nav>
        </Container>
      </header>
      {/* Outside the header, whose empty areas let clicks through to the page. */}
      <MobileNav categories={categories} collections={collections} />
      <Container className="pt-3 md:hidden">
        <SearchBar compact />
      </Container>
    </>
  );
}

/** Thin navy bar above the header: the announcement, plus help links on wide screens. */
export function TopBar({ text, phone }: { text: string | null; phone: string | null }) {
  return (
    <div className="bg-brand-900 text-white">
      <Container className="flex min-h-9 items-center justify-center gap-6 py-1.5 text-xs font-medium sm:text-[13px] lg:justify-between">
        <p className="flex items-center justify-center gap-2 text-center">
          <span aria-hidden className="relative flex size-2 shrink-0">
            <span className="bg-accent-500 absolute inline-flex size-full animate-ping rounded-full opacity-60" />
            <span className="bg-accent-500 relative inline-flex size-2 rounded-full" />
          </span>
          {text ?? `Welcome to ${siteConfig.name}`}
        </p>
        <div className="hidden items-center gap-5 text-white/80 lg:flex">
          <Link href="/track-order" className="hover:text-accent-500 transition-colors">
            Track order
          </Link>
          <Link href="/faq" className="hover:text-accent-500 transition-colors">
            Help &amp; FAQ
          </Link>
          {phone && (
            <a
              href={`tel:${phone.replace(/\s/g, "")}`}
              className="hover:text-accent-500 flex items-center gap-1.5 transition-colors"
            >
              <PhoneIcon width={14} height={14} />
              {phone}
            </a>
          )}
        </div>
      </Container>
    </div>
  );
}
