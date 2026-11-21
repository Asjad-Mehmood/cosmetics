import type { CategoryDTO } from "@store/types";
import { Container, Logo } from "@store/ui";
import Link from "next/link";
import { footerNav, siteConfig } from "@/lib/config";
import { NewsletterForm } from "../home/newsletter-form";
import { CashIcon, MailIcon, PhoneIcon } from "../icons";
import { BackToTop } from "./back-to-top";
import { TrustStrip } from "./trust-strip";

export function Footer({
  categories,
  contact,
}: {
  categories: CategoryDTO[];
  contact: { phone: string | null; email: string | null };
}) {
  const columns = {
    Categories: [
      ...categories.map((c) => ({ label: c.name, href: `/categories/${c.slug}` })),
      { label: "Offers", href: "/offers" },
    ],
    ...footerNav,
  };

  return (
    <footer className="mt-24">
      <BackToTop />
      <div className="border-line border-y">
        <Container className="py-8">
          <TrustStrip />
        </Container>
      </div>

      <div className="bg-brand-700 text-white">
        <Container
          data-gsap="stagger"
          className="grid grid-cols-2 gap-x-6 gap-y-10 py-12 sm:py-14 lg:grid-cols-[1.4fr_repeat(4,1fr)]"
        >
          <div className="col-span-2 lg:col-span-1">
            <span className="text-ink inline-block rounded-xl bg-white px-3 py-2">
              <Logo imgClassName="h-9" />
            </span>
            <p className="mt-4 max-w-sm text-sm text-white/80">{siteConfig.description}</p>
            <ul className="mt-5 space-y-2 text-sm">
              {contact.phone && (
                <li>
                  <a
                    href={`tel:${contact.phone.replace(/\s/g, "")}`}
                    className="inline-flex items-center gap-2 hover:underline"
                  >
                    <PhoneIcon /> {contact.phone}
                  </a>
                </li>
              )}
              {contact.email && (
                <li>
                  <a
                    href={`mailto:${contact.email}`}
                    className="inline-flex items-center gap-2 hover:underline"
                  >
                    <MailIcon /> {contact.email}
                  </a>
                </li>
              )}
            </ul>
          </div>
          {Object.entries(columns).map(([heading, links]) => (
            <div key={heading}>
              <p className="text-sm font-semibold">{heading}</p>
              <ul className="mt-4 space-y-2.5">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-white/80 hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </Container>
        <div className="border-t border-white/15">
          <Container className="flex flex-col gap-3 py-6 text-xs text-white/80 sm:flex-row sm:items-center sm:justify-between">
            <p>
              © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
            </p>
            <p className="flex items-center gap-2">
              We accept
              <span className="inline-flex items-center gap-1.5 rounded-md bg-white/10 px-2 py-1 font-semibold text-white">
                <CashIcon width={16} height={16} /> Cash on Delivery
              </span>
            </p>
          </Container>
        </div>
      </div>
    </footer>
  );
}

/** Newsletter sign-up band, shown above the footer on content-heavy pages. */
export function NewsletterBand() {
  return (
    <section aria-labelledby="newsletter-heading" className="bg-blush">
      <Container className="grid items-center gap-6 py-12 md:grid-cols-2">
        <div>
          <h2
            id="newsletter-heading"
            data-gsap="split"
            className="text-2xl font-bold tracking-tight"
          >
            Get offers and new arrivals first
          </h2>
          <p className="text-muted mt-2">
            Skincare tips, new launches and members-only deals. No spam, unsubscribe anytime.
          </p>
        </div>
        <NewsletterForm />
      </Container>
    </section>
  );
}
