import { Container, Logo } from "@store/ui";
import Link from "next/link";
import { siteConfig } from "@/lib/config";
import { MailIcon, PhoneIcon } from "../icons";
import type { NavData } from "./header";
import { HeaderActions } from "./header-actions";
import { MegaMenu } from "./mega-menu";
import { MinimalSearch } from "./minimal-search";
import { MobileNav, MobileNavButton } from "./mobile-nav";

const navLink =
  "relative px-3 py-2 text-[15px] font-semibold whitespace-nowrap after:absolute after:inset-x-3 after:bottom-1 after:h-px after:origin-left after:scale-x-0 after:bg-current after:transition-transform hover:after:scale-x-100";

/** Minimal design: black announcement bar with help links. */
export function MinimalTopBar({ text }: { text: string | null }) {
  return (
    <div className="bg-ink text-white">
      <Container className="flex min-h-10 items-center justify-center gap-6 py-2 text-[13px] lg:justify-between">
        <p className="text-center">{text ?? `Welcome to ${siteConfig.name}`}</p>
        <nav aria-label="Help" className="hidden items-center gap-6 text-white/90 lg:flex">
          <Link href="/faq" className="hover:text-white">
            Help center
          </Link>
          <Link href="/track-order" className="hover:text-white">
            Track order
          </Link>
          <Link href="/prescription" className="hover:text-white">
            Upload prescription
          </Link>
        </nav>
      </Container>
    </div>
  );
}

/**
 * Minimal design header: phone and email on the left, the logo in the centre,
 * search, account and cart icons on the right, and the menu centred below.
 */
export function MinimalHeader({
  categories,
  collections,
  contact,
}: NavData & { contact: { phone: string | null; email: string | null } }) {
  return (
    <header className="border-line bg-canvas relative z-40 border-b">
      <div className="relative">
        <Container className="grid h-16 grid-cols-[1fr_auto_1fr] items-center gap-3 lg:h-20">
          <div className="flex items-center gap-5 text-[15px]">
            <MobileNavButton />
            {contact.phone && (
              <a
                href={`tel:${contact.phone.replace(/\s/g, "")}`}
                className="hidden items-center gap-2 hover:underline lg:flex"
              >
                <PhoneIcon width={18} height={18} /> {contact.phone}
              </a>
            )}
            {contact.email && (
              <a
                href={`mailto:${contact.email}`}
                className="hidden items-center gap-2 hover:underline xl:flex"
              >
                <MailIcon width={18} height={18} /> {contact.email}
              </a>
            )}
          </div>
          <Link href="/" aria-label={`${siteConfig.name} home`} className="justify-self-center">
            <Logo imgClassName="h-8 sm:h-9 lg:h-11" />
          </Link>
          <div className="flex items-center justify-end gap-1">
            <MinimalSearch />
            {/* Its own box, so the actions' auto margin doesn't push search away. */}
            <div>
              <HeaderActions iconsOnly />
            </div>
          </div>
        </Container>
      </div>

      <div className="hidden lg:block">
        <Container className="flex h-12 items-center justify-center">
          <nav aria-label="Main" className="flex min-w-0 items-center gap-1">
            <MegaMenu categories={categories} collections={collections} />
            <ul className="no-scrollbar flex items-center overflow-x-auto">
              {categories.map((c) => (
                <li key={c.id}>
                  <Link href={`/categories/${c.slug}`} className={navLink}>
                    {c.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/offers" className={`${navLink} text-accent-700`}>
                  Offers
                </Link>
              </li>
              <li>
                <Link href="/about" className={navLink}>
                  About
                </Link>
              </li>
              <li>
                <Link href="/contact" className={navLink}>
                  Contact us
                </Link>
              </li>
            </ul>
          </nav>
        </Container>
      </div>
      <MobileNav categories={categories} collections={collections} />
    </header>
  );
}
