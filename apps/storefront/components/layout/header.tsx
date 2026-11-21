import type { CategoryDTO, CollectionDTO } from "@store/types";
import { Container, Logo } from "@store/ui";
import Link from "next/link";
import { siteConfig } from "@/lib/config";
import { PhoneIcon, PillIcon } from "../icons";
import { HeaderActions } from "./header-actions";
import { MegaMenu } from "./mega-menu";
import { MobileNav, MobileNavButton } from "./mobile-nav";
import { SearchBar } from "./search-box";

export interface NavData {
  categories: CategoryDTO[];
  collections: CollectionDTO[];
}

const barLink =
  "hover:text-brand-700 rounded-full px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors";

/** Sticky site header: logo, search, account and cart, then the category bar. */
export function Header({ categories, collections }: NavData) {
  return (
    <header className="border-line bg-canvas/95 supports-[backdrop-filter]:bg-canvas/85 sticky top-0 z-40 border-b backdrop-blur">
      <Container className="flex h-16 items-center gap-3 lg:h-[72px] lg:gap-6">
        <MobileNavButton />
        <Link href="/" aria-label={`${siteConfig.name} home`} className="shrink-0">
          <Logo imgClassName="h-8 sm:h-9 lg:h-10" />
        </Link>
        <div className="hidden flex-1 md:block">
          <SearchBar />
        </div>
        <HeaderActions />
      </Container>
      <Container className="pb-3 md:hidden">
        <SearchBar compact />
      </Container>

      <div className="border-line hidden border-t lg:block">
        <Container className="flex h-12 items-center gap-1">
          <nav aria-label="Main" className="flex min-w-0 flex-1 items-center gap-1">
            <MegaMenu categories={categories} collections={collections} />
            <ul className="no-scrollbar flex items-center overflow-x-auto">
              {categories.map((c) => (
                <li key={c.id}>
                  <Link href={`/categories/${c.slug}`} className={barLink}>
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="flex shrink-0 items-center gap-1">
            <Link href="/prescription" className={`${barLink} inline-flex items-center gap-1.5`}>
              <PillIcon width={16} height={16} className="text-accent-700" />
              Prescription
            </Link>
            <Link href="/offers" className={`${barLink} text-accent-700`}>
              Offers
            </Link>
            <Link href="/collections/new-arrivals" className={barLink}>
              New arrivals
            </Link>
            <Link href="/collections/best-sellers" className={barLink}>
              Best sellers
            </Link>
          </div>
        </Container>
      </div>
      <MobileNav categories={categories} collections={collections} />
    </header>
  );
}

/** Thin bar above the header: the announcement, plus help links on wide screens. */
export function TopBar({ text, phone }: { text: string | null; phone: string | null }) {
  return (
    <div className="bg-brand-700 text-white">
      <Container className="flex min-h-9 items-center justify-center gap-6 py-1.5 text-xs font-medium sm:text-[13px] lg:justify-between">
        <p className="text-center">{text ?? `Welcome to ${siteConfig.name}`}</p>
        <div className="hidden items-center gap-5 text-white/90 lg:flex">
          <Link href="/track-order" className="hover:text-white hover:underline">
            Track order
          </Link>
          <Link href="/faq" className="hover:text-white hover:underline">
            Help &amp; FAQ
          </Link>
          {phone && (
            <a
              href={`tel:${phone.replace(/\s/g, "")}`}
              className="flex items-center gap-1.5 hover:text-white hover:underline"
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
