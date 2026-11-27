import type { CategoryDTO, HomeContentDTO, ProductCardDTO, StoreReviewsDTO } from "@store/types";
import { Container } from "@store/ui";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { FlashSale } from "@/components/home/flash-sale";
import { HeroCarousel } from "@/components/home/hero-carousel";
import { PromiseMarquee } from "@/components/home/promise-marquee";
import { Slider } from "@/components/home/slider";
import { ChatIcon, PillIcon, RefreshIcon, TruckIcon } from "@/components/icons";
import { NewsletterBand } from "@/components/layout/footer";
import { ProductCard } from "@/components/product/product-card";
import { RecentlyViewed } from "@/components/product/recently-viewed";
import { Stars } from "@/components/product/stars";
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
      <h2
        id={id}
        data-gsap="split"
        className="text-ink text-3xl font-semibold tracking-tight sm:text-4xl"
      >
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

const reviewDate = new Intl.DateTimeFormat("en-PK", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

/** "What our customers say": real, approved reviews from this store. */
function CustomerReviews({ data }: { data: StoreReviewsDTO }) {
  return (
    <section aria-labelledby="reviews-heading" className="pt-16 sm:pt-20">
      <Container>
        <SectionTitle id="reviews-heading" title="What our customers say" />
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[15rem_minmax(0,1fr)]">
          <div className="border-line flex items-center gap-4 lg:h-full lg:border-r lg:pr-8">
            <Image
              src="/brand/logo.png"
              alt=""
              width={112}
              height={40}
              className="h-auto w-28 shrink-0 object-contain"
            />
            <div>
              <p className="text-ink font-semibold uppercase">{siteConfig.name}</p>
              <Stars rating={data.summary.average} size={18} />
              <p className="text-ink mt-0.5 text-sm font-semibold">
                {data.summary.average.toFixed(1)} from {data.summary.count}{" "}
                {data.summary.count === 1 ? "review" : "reviews"}
              </p>
            </div>
          </div>
          <Slider
            label="Customer reviews"
            arrows
            autoplay={5000}
            slideClassName="basis-[85%] sm:basis-1/2 xl:basis-1/4"
          >
            {data.reviews.map((r) => (
              <figure key={r.id} className="bg-surface flex h-full flex-col rounded-lg p-5">
                <figcaption className="flex items-center gap-3">
                  <span
                    aria-hidden
                    className="bg-ink grid size-10 shrink-0 place-items-center rounded-full text-sm font-semibold text-white"
                  >
                    {r.author.charAt(0).toUpperCase()}
                  </span>
                  <span className="min-w-0">
                    <span className="text-ink block truncate text-sm font-semibold">
                      {r.author}
                    </span>
                    <span className="text-muted block text-xs">
                      {reviewDate.format(new Date(r.createdAt))}
                    </span>
                  </span>
                </figcaption>
                <Stars rating={r.rating} size={18} className="mt-3" />
                <blockquote className="mt-2 line-clamp-4 flex-1 text-sm leading-relaxed">
                  {r.title && <strong className="text-ink">{r.title}. </strong>}
                  {r.body}
                </blockquote>
                <Link
                  href={`/products/${r.product.slug}#reviews`}
                  className="text-muted hover:text-ink mt-3 line-clamp-1 text-xs underline-offset-2 hover:underline"
                >
                  {r.product.title}
                </Link>
              </figure>
            ))}
          </Slider>
        </div>
      </Container>
    </section>
  );
}

/**
 * The home page in the minimal design, in the reference store's order: a
 * full-width banner, a sliding range of categories, featured products, a split
 * welcome block, popular picks, best sellers beside a large photo, a black
 * promise ticker, customer reviews and the service promises. The store's own
 * extras (vouchers, flash sale, offers, prescriptions) follow the reviews.
 * Content comes from the same admin data as the classic design.
 */
export function MinimalHome({
  home,
  categories,
  bestSellers,
  newArrivals,
  topRated,
  offers,
  reviews,
}: {
  home: HomeContentDTO | null;
  categories: CategoryDTO[];
  bestSellers: ProductCardDTO[];
  newArrivals: ProductCardDTO[];
  topRated: ProductCardDTO[];
  offers: ProductCardDTO[];
  reviews: StoreReviewsDTO | null;
}) {
  const banners = home?.banners ?? [];
  const tiles = categories.filter((c) => c.imageUrl);
  const imageOf = (slug: string) => categories.find((c) => c.slug === slug)?.imageUrl;
  const welcomeImage = imageOf("skincare") ?? tiles[0]?.imageUrl ?? null;
  const lookbookImage = banners[1]?.imageUrl ?? imageOf("makeup") ?? tiles[1]?.imageUrl ?? null;
  const featured = newArrivals.length >= 3 ? newArrivals : bestSellers;

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
              &ldquo;Genuine skincare, makeup, hair care, fragrance and health essentials, from the
              brands you trust to your door.&rdquo;
            </SectionTitle>
            <Slider label="Shop by category" slideClassName="basis-full sm:basis-1/2 lg:basis-1/4">
              {tiles.map((c) => (
                <Link key={c.id} href={`/categories/${c.slug}`} className="group block text-center">
                  <div className="relative mx-auto aspect-square w-full max-w-sm overflow-hidden">
                    <Image
                      src={c.imageUrl!}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  <p className="text-ink mt-5 text-base font-semibold group-hover:underline">
                    {c.name}
                  </p>
                </Link>
              ))}
            </Slider>
          </Container>
        </section>
      )}

      {featured.length > 0 && (
        <section aria-labelledby="featured-heading" className="pt-16 sm:pt-20">
          <Container>
            <SectionTitle id="featured-heading" title="Featured products">
              Quality you can trust, picked for you.
            </SectionTitle>
            <ProductGrid3 products={featured.slice(0, 6)} />
            <ViewAll href="/shop">View all products</ViewAll>
          </Container>
        </section>
      )}

      <section aria-labelledby="welcome-heading" className="pt-16 sm:pt-20">
        <Container>
          <div className="bg-surface grid overflow-hidden md:grid-cols-2">
            {welcomeImage && (
              <div className="relative min-h-80 md:min-h-[40rem]">
                <Image
                  src={welcomeImage}
                  alt=""
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>
            )}
            <div className="flex flex-col items-center justify-center px-6 py-14 text-center sm:px-10 lg:px-14">
              <p className="text-ink text-sm font-semibold">Beauty, Health &amp; Wellness</p>
              <h2
                id="welcome-heading"
                className="text-ink mt-3 text-3xl font-semibold tracking-tight sm:text-4xl"
              >
                Welcome to {siteConfig.name}, Care You Can Trust
              </h2>
              <p className="mt-5 max-w-xl leading-relaxed">
                Welcome to <strong className="text-ink">{siteConfig.name}</strong>, your trusted
                destination for skincare, makeup, hair care, fragrance and everyday health
                essentials. We stock genuine products from the brands and their authorised
                distributors, so what you put on your skin and in your medicine cabinet is always
                the real thing.
              </p>
              <h3 className="text-ink mt-7 text-2xl font-semibold tracking-tight">
                Why choose {siteConfig.name}?
              </h3>
              <p className="mt-4 max-w-xl leading-relaxed">
                At <strong className="text-ink">{siteConfig.name}</strong>, every order is checked
                before it ships, delivered across Pakistan and paid for in cash when it reaches you.
                Not sure what suits you? Our team and pharmacist are a message away, and medicines
                can be ordered with a photo of your prescription.
              </p>
              <p className="mt-4 max-w-xl leading-relaxed">
                Explore our range of skincare, makeup, hair care, fragrance and wellness products,
                all in one place.
              </p>
              <p className="text-ink mt-5 font-semibold">Look good. Feel good.</p>
              <Link
                href="/shop"
                className="bg-ink mt-7 inline-flex h-12 items-center rounded-full px-14 text-[15px] font-semibold text-white hover:bg-black/85"
              >
                Shop now
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {topRated.length > 0 && (
        <section aria-labelledby="popular-heading" className="pt-16 sm:pt-20">
          <Container>
            <SectionTitle id="popular-heading" title="Popular picks">
              Our best-rated products, loved by customers again and again.
            </SectionTitle>
            <ProductGrid3 products={topRated.slice(0, 6)} />
          </Container>
        </section>
      )}

      {bestSellers.length > 0 && (
        <section aria-labelledby="bestsellers-heading" className="pt-16 sm:pt-20">
          <Container>
            <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-2">
              <div className="min-w-0">
                <SectionTitle id="bestsellers-heading" title="Shop our bestsellers">
                  Explore our top-selling products. Whether you are looking for everyday skincare, a
                  new shade or a health essential, find what works for you.
                </SectionTitle>
                <Slider label="Best sellers" slideClassName="basis-1/2">
                  {bestSellers.slice(0, 8).map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </Slider>
              </div>
              {lookbookImage && (
                <Link
                  href="/collections/best-sellers"
                  aria-label="Shop all best sellers"
                  className="group relative hidden aspect-[4/4.2] overflow-hidden lg:block"
                >
                  <Image
                    src={lookbookImage}
                    alt=""
                    fill
                    sizes="50vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                  />
                </Link>
              )}
            </div>
          </Container>
        </section>
      )}

      <div className="pt-16 sm:pt-20">
        <PromiseMarquee />
      </div>

      {reviews && reviews.reviews.length > 0 && <CustomerReviews data={reviews} />}

      {(home?.vouchers.length ?? 0) > 0 && (
        <Container className="pt-16">
          <VoucherStrip title="Collect vouchers" />
        </Container>
      )}

      {home?.flashSale && offers.length > 0 && (
        <Container className="pt-16 sm:pt-20">
          <FlashSale sale={home.flashSale} products={offers} />
        </Container>
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
            With reliable delivery, easy returns and real help, we make shopping stress-free.
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
