import type { CategoryDTO, HomeContentDTO, ProductCardDTO } from "@store/types";
import { Container } from "@store/ui";
import Image from "next/image";
import type { CSSProperties } from "react";
import Link from "next/link";
import { BuyAgain } from "@/components/home/buy-again";
import { DeliveryStory } from "@/components/home/delivery-story";
import { HeroCarousel } from "@/components/home/hero-carousel";
import { JustForYou } from "@/components/home/just-for-you";
import { PromiseMarquee } from "@/components/home/promise-marquee";
import {
  ChevronRightIcon,
  ClockIcon,
  HeartIcon,
  LeafIcon,
  PillIcon,
  ShieldIcon,
  SparkleIcon,
} from "@/components/icons";
import { NewsletterBand } from "@/components/layout/footer";
import { ProductRail } from "@/components/product/product-rail";
import { RecentlyViewed } from "@/components/product/recently-viewed";
import { Reveal } from "@/components/reveal";
import { VoucherStrip } from "@/components/vouchers";
import { siteConfig } from "@/lib/config";
import { getData, getDataSafe, getList } from "@/lib/server-api";

/** "Shop by concern": each tile runs a search for that concern. */
const CONCERNS = [
  { label: "Dark spots", q: "dark spots", icon: SparkleIcon, tone: "bg-accent-50 text-accent-700" },
  { label: "Hydration", q: "hyaluronic", icon: LeafIcon, tone: "bg-mint text-brand-700" },
  { label: "Sun protection", q: "SPF", icon: ShieldIcon, tone: "bg-[#fff4e0] text-[#8a5300]" },
  { label: "Frizzy hair", q: "frizz", icon: SparkleIcon, tone: "bg-[#f1ecfb] text-[#5b3b9a]" },
  { label: "Heart health", q: "heart", icon: HeartIcon, tone: "bg-accent-50 text-accent-700" },
  { label: "Fever care", q: "thermometer", icon: ClockIcon, tone: "bg-mint text-brand-700" },
];

export default async function HomePage() {
  const [home, categories, bestSellers, newArrivals, offers, forYou] = await Promise.all([
    getDataSafe<HomeContentDTO | null>("/cms/home", null, { revalidate: 300 }),
    getData<CategoryDTO[]>("/categories", { revalidate: 300 }),
    getList<ProductCardDTO>("/products?sort=best_selling&limit=10"),
    getList<ProductCardDTO>("/products?collection=new-arrivals&sort=newest&limit=10"),
    getList<ProductCardDTO>("/products?onSale=true&sort=best_selling&limit=10"),
    getList<ProductCardDTO>("/products?sort=top_rated&limit=10&page=1"),
  ]);
  const banners = home?.banners ?? [];
  const makeup = categories?.find((c) => c.slug === "makeup");
  const wellness = categories?.find((c) => c.slug === "health-wellness");

  // Lets search engines show the store name, logo and a search box.
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "OnlineStore",
      name: siteConfig.name,
      url: siteConfig.url,
      logo: `${siteConfig.url}/brand/logo.png`,
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
          <HeroCarousel banners={banners} />
        ) : (
          <section className="bg-brand-700 rounded-3xl px-6 py-16 text-white sm:px-12">
            <p className="text-3xl font-extrabold sm:text-5xl">
              Genuine beauty and health care, delivered.
            </p>
            <Link
              href="/shop"
              className="text-ink mt-8 inline-flex h-12 items-center rounded-full bg-white px-7 font-semibold"
            >
              Shop now
            </Link>
          </section>
        )}
      </Container>

      <div className="pt-6">
        <PromiseMarquee />
      </div>

      <Container className="pt-6">
        <VoucherStrip title="Collect vouchers" />
      </Container>

      {categories && categories.length > 0 && (
        <section aria-labelledby="categories-heading">
          <Container className="pt-12">
            <div className="mb-6 flex items-end justify-between">
              <h2
                id="categories-heading"
                data-gsap="split"
                className="text-2xl font-bold tracking-tight"
              >
                Shop by category
              </h2>
              <Link href="/shop" className="text-brand-700 text-sm font-semibold hover:underline">
                All products
              </Link>
            </div>
            <Reveal
              as="ul"
              stagger
              className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-5 sm:gap-6 sm:px-0"
            >
              {categories.map((c, i) => (
                <li
                  key={c.id}
                  style={{ "--i": i } as CSSProperties}
                  className="reveal-item w-24 shrink-0 sm:w-auto"
                >
                  <Link
                    href={`/categories/${c.slug}`}
                    className="group block text-center transition-transform active:scale-95"
                  >
                    <span className="bg-blush ring-line group-hover:ring-brand-600 group-hover:shadow-(--shadow-card) relative mx-auto block aspect-square w-full overflow-hidden rounded-full ring-1 transition duration-300 group-hover:-translate-y-1 group-hover:ring-2 sm:w-36">
                      {c.imageUrl && (
                        <Image
                          src={c.imageUrl}
                          alt=""
                          fill
                          sizes="(min-width: 640px) 144px, 96px"
                          priority={i < 3}
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      )}
                    </span>
                    <span className="mt-3 block text-sm font-semibold group-hover:underline">
                      {c.name}
                    </span>
                    <span className="text-muted block text-xs">
                      {c.productCount} {c.productCount === 1 ? "product" : "products"}
                    </span>
                  </Link>
                </li>
              ))}
            </Reveal>
          </Container>
        </section>
      )}

      <Container>
        <BuyAgain />
      </Container>

      <Container className="pt-14">
        <ProductRail
          title="Best sellers"
          subtitle="What our customers buy again and again"
          products={bestSellers.data}
          href="/collections/best-sellers"
          linkLabel="See all best sellers"
        />
      </Container>

      <section aria-labelledby="concerns-heading">
        <Container className="pt-14">
          <h2
            id="concerns-heading"
            data-gsap="split"
            className="mb-6 text-2xl font-bold tracking-tight"
          >
            Shop by concern
          </h2>
          <Reveal as="ul" stagger className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {CONCERNS.map(({ label, q, icon: Icon, tone }, i) => (
              <li key={label} style={{ "--i": i } as CSSProperties} className="reveal-item">
                <Link
                  href={`/search?q=${encodeURIComponent(q)}`}
                  className={`${tone} hover:shadow-(--shadow-card) group flex h-full items-center gap-3 rounded-2xl px-4 py-4 transition duration-300 hover:-translate-y-0.5 active:scale-[.97]`}
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white/80 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110">
                    <Icon width={20} height={20} />
                  </span>
                  <span className="text-ink text-sm font-semibold group-hover:underline">
                    {label}
                  </span>
                </Link>
              </li>
            ))}
          </Reveal>
        </Container>
      </section>

      <Container className="pt-14">
        <DeliveryStory />
      </Container>

      <Container className="pt-14">
        <ProductRail
          title="New arrivals"
          subtitle="Fresh launches and restocks"
          products={newArrivals.data}
          href="/collections/new-arrivals"
          linkLabel="See all new"
        />
      </Container>

      {(makeup || wellness) && (
        <Container className="pt-14">
          <Reveal stagger className="grid gap-4 md:grid-cols-2">
            {[
              makeup && {
                c: makeup,
                bg: "bg-accent-50",
                eyebrow: "Makeup",
                title: "Colour that lasts all day",
                cta: "Shop makeup",
              },
              wellness && {
                c: wellness,
                bg: "bg-mint",
                eyebrow: "Health & wellness",
                title: "Everyday essentials for the whole family",
                cta: "Shop health",
              },
            ]
              .filter((x) => !!x)
              .map(({ c, bg, eyebrow, title, cta }, i) => (
                <Link
                  key={c.id}
                  href={`/categories/${c.slug}`}
                  style={{ "--i": i } as CSSProperties}
                  data-gsap="tilt"
                  className={`${bg} reveal-item hover:shadow-(--shadow-card) group relative flex min-h-56 overflow-hidden rounded-3xl active:scale-[.99]`}
                >
                  <div className="relative z-10 flex w-3/5 flex-col justify-center p-6 sm:p-8">
                    <p className="text-brand-700 text-xs font-semibold uppercase tracking-widest">
                      {eyebrow}
                    </p>
                    <p className="mt-2 text-xl font-bold leading-tight sm:text-2xl">{title}</p>
                    <span className="text-brand-700 mt-4 inline-flex items-center gap-1 text-sm font-semibold group-hover:underline">
                      {cta}{" "}
                      <ChevronRightIcon
                        width={16}
                        height={16}
                        className="transition-transform group-hover:translate-x-1"
                      />
                    </span>
                  </div>
                  {c.imageUrl && (
                    <div
                      data-gsap="parallax"
                      className="absolute inset-y-0 right-0 w-2/5 overflow-hidden"
                    >
                      <Image
                        src={c.imageUrl}
                        alt=""
                        fill
                        sizes="(min-width: 768px) 20vw, 40vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    </div>
                  )}
                </Link>
              ))}
          </Reveal>
        </Container>
      )}

      {offers.data.length > 0 && (
        <Container className="pt-14">
          <ProductRail
            title="Offers"
            subtitle="Genuine products at lower prices"
            products={offers.data}
            href="/offers"
            linkLabel="See all offers"
          />
        </Container>
      )}

      <Container className="pt-14">
        <section
          data-gsap="zoom"
          aria-labelledby="pharmacy-heading"
          className="bg-brand-700 grid gap-6 overflow-hidden rounded-3xl px-6 py-8 text-white sm:px-10 md:grid-cols-[auto_1fr_auto] md:items-center"
        >
          <span className="relative grid size-16 place-items-center rounded-2xl bg-white/10">
            <PillIcon
              width={32}
              height={32}
              className="motion-safe:animate-[float_4s_ease-in-out_infinite]"
            />
            <span
              aria-hidden
              className="bg-accent-500 absolute -right-1 -top-1 size-3 rounded-full"
            >
              <span className="bg-accent-500 absolute inset-0 animate-ping rounded-full" />
            </span>
          </span>
          <div>
            <h2 id="pharmacy-heading" data-gsap="split" className="text-2xl font-bold">
              Prescription medicines are coming soon
            </h2>
            <p className="mt-2 max-w-2xl text-white/85">
              Upload your prescription at checkout and our registered pharmacist will check it
              before your order is sent. Until then, shop vitamins, supplements and health devices.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/categories/health-wellness"
              className="text-ink inline-flex h-11 items-center rounded-full bg-white px-5 text-sm font-semibold hover:bg-white/90"
            >
              Shop health
            </Link>
            <Link
              href="/faq"
              className="inline-flex h-11 items-center rounded-full border border-white/40 px-5 text-sm font-semibold hover:bg-white/10"
            >
              How it will work
            </Link>
          </div>
        </section>
      </Container>

      <Container className="pt-14">
        <JustForYou initial={forYou} />
      </Container>

      <Container className="pt-6">
        <RecentlyViewed />
      </Container>

      <div className="-mb-24 pt-14">
        <NewsletterBand />
      </div>
    </>
  );
}
