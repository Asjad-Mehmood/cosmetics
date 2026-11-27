import type { CategoryDTO, HomeContentDTO, ProductCardDTO } from "@store/types";
import { Container } from "@store/ui";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { FlashSale } from "@/components/home/flash-sale";
import { HeroCarousel } from "@/components/home/hero-carousel";
import { PromiseMarquee } from "@/components/home/promise-marquee";
import { ChatIcon, PillIcon, RefreshIcon, TruckIcon } from "@/components/icons";
import { NewsletterBand } from "@/components/layout/footer";
import { ProductCard } from "@/components/product/product-card";
import { RecentlyViewed } from "@/components/product/recently-viewed";
import { VoucherStrip } from "@/components/vouchers";
import { siteConfig } from "@/lib/config";

/** A centred section heading with a short line under it. */
function SectionTitle({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="mx-auto mb-8 max-w-2xl text-center sm:mb-10">
      <h2 id={id} data-gsap="split" className="text-3xl font-semibold tracking-tight sm:text-4xl">
        {title}
      </h2>
      {children && <p className="text-muted mt-3 text-[15px] leading-relaxed">{children}</p>}
    </div>
  );
}

function ProductGrid3({ products }: { products: ProductCardDTO[] }) {
  return (
    <div
      data-gsap="stagger"
      className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-3 lg:gap-x-8"
    >
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}

const ViewAll = ({ href, children }: { href: string; children: ReactNode }) => (
  <div className="mt-10 text-center">
    <Link
      href={href}
      className="border-ink hover:bg-ink inline-flex h-12 items-center rounded-full border px-8 text-sm font-semibold transition-colors hover:text-white"
    >
      {children}
    </Link>
  </div>
);

const SERVICES = [
  {
    icon: TruckIcon,
    title: "Delivery across Pakistan",
    body: "Fast, tracked delivery to your door, with Cash on Delivery in every city.",
  },
  {
    icon: RefreshIcon,
    title: "Easy returns",
    body: "Unopened items can be returned within 7 days. Damaged or wrong items are always replaced.",
  },
  {
    icon: ChatIcon,
    title: "Real people to help",
    body: "Questions about a product or an order? Our team and pharmacist are a message away.",
  },
];

/**
 * The home page in the minimal design: an edge-to-edge banner, centred
 * section titles, roomy three-column product grids, a split welcome block and
 * a black promise ticker. Content comes from the same admin data as the
 * classic design (banners, categories, best sellers, offers).
 */
export function MinimalHome({
  home,
  categories,
  bestSellers,
  newArrivals,
  topRated,
  offers,
}: {
  home: HomeContentDTO | null;
  categories: CategoryDTO[];
  bestSellers: ProductCardDTO[];
  newArrivals: ProductCardDTO[];
  topRated: ProductCardDTO[];
  offers: ProductCardDTO[];
}) {
  const banners = home?.banners ?? [];
  const tiles = categories.filter((c) => c.imageUrl).slice(0, 8);
  const welcomeImage =
    categories.find((c) => c.slug === "skincare")?.imageUrl ?? tiles[0]?.imageUrl ?? null;

  return (
    <>
      {banners.length > 0 ? (
        <HeroCarousel banners={banners} bleed />
      ) : (
        <section className="bg-surface py-24 text-center">
          <Container>
            <p className="text-4xl font-semibold tracking-tight sm:text-6xl">
              Beauty and health care, delivered.
            </p>
            <Link
              href="/shop"
              className="bg-ink mt-8 inline-flex h-12 items-center rounded-full px-8 font-semibold text-white"
            >
              Shop now
            </Link>
          </Container>
        </section>
      )}

      {tiles.length > 0 && (
        <section aria-labelledby="range-heading" className="pt-16 sm:pt-20">
          <Container>
            <SectionTitle id="range-heading" title="Explore our range">
              Skincare, makeup, hair care, fragrance and everyday health essentials, all in one
              place.
            </SectionTitle>
            <ul className="no-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-4 sm:gap-6 sm:overflow-visible sm:px-0">
              {tiles.map((c) => (
                <li key={c.id} className="w-40 shrink-0 snap-start sm:w-auto">
                  <Link href={`/categories/${c.slug}`} className="group block text-center">
                    <div className="bg-surface relative aspect-square overflow-hidden rounded-md">
                      <Image
                        src={c.imageUrl!}
                        alt=""
                        fill
                        sizes="(min-width: 640px) 25vw, 160px"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    </div>
                    <p className="mt-4 text-[15px] font-semibold group-hover:underline">{c.name}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </Container>
        </section>
      )}

      {(home?.vouchers.length ?? 0) > 0 && (
        <Container className="pt-12">
          <VoucherStrip title="Collect vouchers" />
        </Container>
      )}

      {bestSellers.length > 0 && (
        <section aria-labelledby="featured-heading" className="pt-16 sm:pt-20">
          <Container>
            <SectionTitle id="featured-heading" title="Featured products">
              Our customers&apos; favourites, chosen again and again.
            </SectionTitle>
            <ProductGrid3 products={bestSellers.slice(0, 6)} />
            <ViewAll href="/collections/best-sellers">View all best sellers</ViewAll>
          </Container>
        </section>
      )}

      <section aria-labelledby="welcome-heading" className="pt-16 sm:pt-20">
        <Container>
          <div className="bg-surface grid overflow-hidden rounded-md md:grid-cols-2">
            {welcomeImage && (
              <div className="relative min-h-72 md:min-h-[28rem]">
                <Image
                  src={welcomeImage}
                  alt=""
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>
            )}
            <div className="flex flex-col items-center justify-center px-6 py-12 text-center sm:px-12">
              <p className="text-ink text-xs font-semibold uppercase tracking-widest">
                Beauty · Pharmacy · Wellness
              </p>
              <h2
                id="welcome-heading"
                className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl"
              >
                Welcome to {siteConfig.name}
              </h2>
              <p className="text-muted mt-4 max-w-md leading-relaxed">
                We bring together the skincare, makeup, hair care, fragrance and health products
                Pakistan trusts, from brands and their authorised distributors. Every order is
                checked before it ships and paid for in cash when it reaches you.
              </p>
              <p className="text-muted mt-3 max-w-md leading-relaxed">
                Need medicines? Upload your prescription and our pharmacist will call you to
                confirm.
              </p>
              <Link
                href="/shop"
                className="bg-ink mt-8 inline-flex h-12 items-center rounded-full px-8 text-sm font-semibold text-white hover:bg-black/85"
              >
                Shop now
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {home?.flashSale && offers.length > 0 && (
        <Container className="pt-16 sm:pt-20">
          <FlashSale sale={home.flashSale} products={offers} />
        </Container>
      )}

      {newArrivals.length > 0 && (
        <section aria-labelledby="new-heading" className="pt-16 sm:pt-20">
          <Container>
            <SectionTitle id="new-heading" title="New arrivals">
              Fresh launches and restocks.
            </SectionTitle>
            <ProductGrid3 products={newArrivals.slice(0, 6)} />
            <ViewAll href="/collections/new-arrivals">View all new arrivals</ViewAll>
          </Container>
        </section>
      )}

      <div className="pt-16 sm:pt-20">
        <PromiseMarquee />
      </div>

      {topRated.length > 0 && (
        <section aria-labelledby="popular-heading" className="pt-16 sm:pt-20">
          <Container>
            <SectionTitle id="popular-heading" title="Popular picks">
              The best-rated products in the store.
            </SectionTitle>
            <ProductGrid3 products={topRated.slice(0, 6)} />
          </Container>
        </section>
      )}

      {!home?.flashSale && offers.length > 0 && (
        <section aria-labelledby="offers-heading" className="pt-16 sm:pt-20">
          <Container>
            <SectionTitle id="offers-heading" title="On offer now">
              Lower prices while stocks last.
            </SectionTitle>
            <ProductGrid3 products={offers.slice(0, 6)} />
            <ViewAll href="/offers">View all offers</ViewAll>
          </Container>
        </section>
      )}

      <section aria-labelledby="rx-heading" className="pt-16 sm:pt-20">
        <Container>
          <div className="border-line flex flex-col items-center gap-5 rounded-md border px-6 py-10 text-center sm:px-12">
            <PillIcon width={32} height={32} />
            <h2 id="rx-heading" className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Order medicines with your prescription
            </h2>
            <p className="text-muted max-w-xl leading-relaxed">
              Send a photo of your prescription. Our pharmacist checks it, calls you to confirm the
              medicines and the total, and we deliver to your door.
            </p>
            <Link
              href="/prescription"
              className="bg-ink inline-flex h-12 items-center rounded-full px-8 text-sm font-semibold text-white hover:bg-black/85"
            >
              Upload prescription
            </Link>
          </div>
        </Container>
      </section>

      <Container className="pt-10">
        <RecentlyViewed />
      </Container>

      <section aria-labelledby="comfort-heading" className="pb-4 pt-16 sm:pt-20">
        <Container>
          <SectionTitle id="comfort-heading" title="Your comfort, our priority">
            Reliable delivery, easy returns and real help whenever you need it.
          </SectionTitle>
          <ul className="grid gap-10 sm:grid-cols-3">
            {SERVICES.map(({ icon: Icon, title, body }) => (
              <li key={title} className="text-center">
                <Icon width={30} height={30} className="mx-auto" />
                <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                <p className="text-muted mx-auto mt-2 max-w-xs text-[15px] leading-relaxed">
                  {body}
                </p>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <div className="-mb-24 pt-16">
        <NewsletterBand />
      </div>
    </>
  );
}
