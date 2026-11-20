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
      <div className="border-line border-y bg-white">
        <Container className="py-8">
          <TrustStrip />
        </Container>
      </div>

      <div className="bg-brand-900 text-slate-100">
        <Container className="grid grid-cols-2 gap-x-6 gap-y-10 py-14 sm:py-16 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div className="col-span-2 lg:col-span-1">
            <Logo onDark markClassName="size-8" />
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/70">
              {siteConfig.description}
            </p>
            <ul className="mt-6 space-y-2.5 text-sm">
              {contact.phone && (
                <li>
                  <a
                    href={`tel:${contact.phone.replace(/\s/g, "")}`}
                    className="hover:text-accent-500 inline-flex items-center gap-2.5 font-semibold transition-colors"
                  >
                    <PhoneIcon className="text-accent-500" /> {contact.phone}
                  </a>
                </li>
              )}
              {contact.email && (
                <li>
                  <a
                    href={`mailto:${contact.email}`}
                    className="hover:text-accent-500 inline-flex items-center gap-2.5 transition-colors"
                  >
                    <MailIcon className="text-accent-500" /> {contact.email}
                  </a>
                </li>
              )}
            </ul>
            <p className="eyebrow text-accent-500 mt-8">Our promise</p>
            <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.14em] text-white/80">
              Genuine products · Cash on delivery · Easy returns
            </p>
          </div>
          {Object.entries(columns).map(([heading, links]) => (
            <div key={heading}>
              <p className="border-accent-500 border-l-2 pl-3 text-[11px] font-bold uppercase tracking-[0.18em] text-white/60">
                {heading}
              </p>
              <ul className="mt-5 space-y-3">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="hover:text-accent-500 text-sm text-white/80 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </Container>
        <div className="border-t border-white/10">
          <Container className="flex flex-col gap-3 py-6 text-xs text-white/60 sm:flex-row sm:items-center sm:justify-between">
            <p>
              © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
            </p>
            <p className="flex items-center gap-2">
              We accept
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 font-semibold text-white">
                <CashIcon width={16} height={16} className="text-accent-500" /> Cash on Delivery
              </span>
            </p>
          </Container>
        </div>
      </div>
    </footer>
  );
}

/** Newsletter sign-up: a dark navy band with a gold button, shown above the footer. */
export function NewsletterBand() {
  return (
    <section
      aria-labelledby="newsletter-heading"
      className="bg-brand-700 relative overflow-hidden text-white"
    >
      <div
        aria-hidden
        className="bg-accent-500/10 pointer-events-none absolute -right-32 -top-32 size-96 rounded-full blur-3xl"
      />
      <Container className="relative grid items-center gap-8 py-16 md:grid-cols-2 md:py-20">
        <div>
          <p className="eyebrow text-accent-500">Members&rsquo; list</p>
          <h2 id="newsletter-heading" className="display mt-4 text-3xl sm:text-4xl">
            Get offers and new arrivals first
          </h2>
          <p className="mt-4 max-w-md text-white/70">
            Skincare tips, new launches and members-only deals. No spam, unsubscribe anytime.
          </p>
        </div>
        <NewsletterForm onDark />
      </Container>
    </section>
  );
}
