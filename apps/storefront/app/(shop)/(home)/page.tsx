import type { CategoryDTO, FaqDTO, HomeContentDTO, ProductCardDTO } from "@store/types";
import { Container } from "@store/ui";
import Link from "next/link";
import type { CSSProperties } from "react";
import {
  CategoryCards,
  FaqTeaser,
  Marquee,
  PharmacyPanel,
  Showcase,
  StatsRow,
  Statement,
} from "@/components/home/blume-sections";
import { BuyAgain } from "@/components/home/buy-again";
import { HeroCarousel } from "@/components/home/hero-carousel";
import { JustForYou } from "@/components/home/just-for-you";
import { ClockIcon, HeartIcon, LeafIcon, ShieldIcon, SparkleIcon } from "@/components/icons";
import { NewsletterBand } from "@/components/layout/footer";
import { ProductRail } from "@/components/product/product-rail";
import { RecentlyViewed } from "@/components/product/recently-viewed";
import { VoucherStrip } from "@/components/vouchers";
import { siteConfig } from "@/lib/config";
import { getData, getDataSafe, getList } from "@/lib/server-api";

/** "Shop by concern": each tile runs a search for that concern. */
const CONCERNS = [
  { label: "Dark spots", q: "dark spots", icon: SparkleIcon },
  { label: "Hydration", q: "hyaluronic", icon: LeafIcon },
  { label: "Sun protection", q: "SPF", icon: ShieldIcon },
  { label: "Frizzy hair", q: "frizz", icon: SparkleIcon },
  { label: "Heart health", q: "heart", icon: HeartIcon },
  { label: "Fever care", q: "thermometer", icon: ClockIcon },
];

export default async function HomePage() {
  const [home, categories, bestSellers, newArrivals, offers, forYou, faqs] = await Promise.all([
    getDataSafe<HomeContentDTO | null>("/cms/home", null, { revalidate: 300 }),
    getData<CategoryDTO[]>("/categories", { revalidate: 300 }),
    getList<ProductCardDTO>("/products?sort=best_selling&limit=10"),
    getList<ProductCardDTO>("/products?collection=new-arrivals&sort=newest&limit=10"),
    getList<ProductCardDTO>("/products?onSale=true&sort=best_selling&limit=10"),
    getList<ProductCardDTO>("/products?sort=top_rated&limit=10&page=1"),
    getDataSafe<FaqDTO[]>("/cms/faq", [], { revalidate: 300 }),
  ]);
  const banners = home?.banners ?? [];
  const cats = categories ?? [];

  // Lets search engines show the store name, logo and a search box.
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "OnlineStore",
      name: siteConfig.name,
      url: siteConfig.url,
      logo: `${siteConfig.url}/icon.svg`,
      description: siteConfig.description,
      areaServed: "PK",
      currenciesAccepted: "PKR",
      paymentAccepted: "Cash",
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: siteConfig.name,
      url: siteConfig.url,
      potentialAction: {
        "@type": "SearchAction",
        target: `${siteConfig.url}/search?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
      <h1 className="sr-only">{siteConfig.name}: beauty and pharmacy store in Pakistan</h1>

      <Container className="pt-4 sm:pt-6">
        {banners.length > 0 ? (
          <HeroCarousel banners={banners} featured={bestSellers.data[0]} />
        ) : (
          <section className="bg-brand-900 rounded-[2rem] px-6 py-24 text-white sm:px-12">
            <p className="display text-5xl sm:text-7xl">Genuine beauty and health care</p>
            <Link
              href="/shop"
              className="bg-accent-500 text-brand-700 mt-8 inline-flex h-12 items-center rounded-full px-7 text-sm font-bold uppercase tracking-wider"
            >
              Shop now
            </Link>
          </section>
        )}
      </Container>

      <div className="mt-8">
        <StatsRow categories={cats} />
      </div>
      <Statement categories={cats} />
      <Marquee categories={cats} />

      <Container className="pt-12">
        <VoucherStrip title="Collect vouchers" />
      </Container>

      <div className="mt-12">
        <CategoryCards categories={cats} />
      </div>

      <Container>
        <BuyAgain />
      </Container>

      <Container className="reveal pt-20">
        <ProductRail
          eyebrow="Most loved"
          title="Best sellers"
          subtitle="What our customers buy again and again"
          products={bestSellers.data}
          href="/collections/best-sellers"
          linkLabel="See all best sellers"
        />
      </Container>

      <section aria-labelledby="concerns-heading">
        <Container className="reveal pt-20">
          <p className="eyebrow text-accent-700">Find what works</p>
          <h2 id="concerns-heading" className="display mb-8 mt-4 text-3xl sm:text-4xl">
            Shop by concern
          </h2>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {CONCERNS.map(({ label, q, icon: Icon }, i) => (
              <li key={label} className="reveal-card" style={{ "--i": i } as CSSProperties}>
                <Link
                  href={`/search?q=${encodeURIComponent(q)}`}
                  className="border-line hover:border-brand-600 hover:shadow-(--shadow-card) group flex h-full items-center gap-3 rounded-full border bg-white py-2 pl-2 pr-4 transition duration-300 hover:-translate-y-0.5"
                >
                  <span className="bg-accent-50 text-accent-700 group-hover:bg-brand-600 group-hover:text-accent-500 grid size-10 shrink-0 place-items-center rounded-full transition-colors">
                    <Icon width={18} height={18} />
                  </span>
                  <span className="text-sm font-bold">{label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <Container className="reveal pt-20">
        <ProductRail
          eyebrow="Just landed"
          title="New arrivals"
          subtitle="Fresh launches and restocks"
          products={newArrivals.data}
          href="/collections/new-arrivals"
          linkLabel="See all new"
        />
      </Container>

      <Showcase categories={cats} />

      {offers.data.length > 0 && (
        <Container className="reveal">
          <ProductRail
            eyebrow="Save more"
            title="Offers"
            subtitle="Genuine products at lower prices"
            products={offers.data}
            href="/offers"
            linkLabel="See all offers"
          />
        </Container>
      )}

      <Container className="pt-20">
        <PharmacyPanel />
      </Container>

      <Container className="reveal pt-20">
        <JustForYou initial={forYou} />
      </Container>

      <Container className="pt-6">
        <RecentlyViewed />
      </Container>

      <FaqTeaser faqs={faqs ?? []} />

      <div className="-mb-24">
        <NewsletterBand />
      </div>
    </>
  );
}
