import type { CategoryDTO, HomeContentDTO, ProductCardDTO } from "@store/types";
import { Card, Container } from "@store/ui";
import Image from "next/image";
import { RecentlyViewed } from "@/components/product/recently-viewed";
import Link from "next/link";
import { RefreshIcon, ShieldIcon, TruckIcon } from "@/components/icons";
import { ProductGrid } from "@/components/product/product-card";
import { siteConfig } from "@/lib/config";
import { getData, getDataSafe, getList } from "@/lib/server-api";

const perks = [
  {
    icon: ShieldIcon,
    title: "100% genuine products",
    body: "Sourced from brands and authorised distributors only.",
  },
  {
    icon: TruckIcon,
    title: "Fast nationwide delivery",
    body: "1-2 days in Lahore, 2-5 days across Pakistan. Cash on Delivery.",
  },
  {
    icon: RefreshIcon,
    title: "Easy returns",
    body: "Unopened beauty and personal care items within 7 days.",
  },
];

const TILE_TONES = ["bg-[#0f5e63]", "bg-[#9c3d52]", "bg-[#2f4858]", "bg-[#5b4a6b]"];

function Section({
  title,
  href,
  linkLabel,
  children,
}: {
  title: string;
  href: string;
  linkLabel: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <Container className="py-14">
        <div className="mb-6 flex items-end justify-between gap-4">
          <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
          <Link href={href} className="text-sm font-medium underline">
            {linkLabel}
          </Link>
        </div>
        {children}
      </Container>
    </section>
  );
}

export default async function HomePage() {
  const [home, categories, newArrivals, bestSellers] = await Promise.all([
    getDataSafe<HomeContentDTO | null>("/cms/home", null, { revalidate: 300 }),
    getData<CategoryDTO[]>("/categories", { revalidate: 300 }),
    getList<ProductCardDTO>("/products?collection=new-arrivals&sort=newest&limit=4"),
    getList<ProductCardDTO>("/products?sort=best_selling&limit=4"),
  ]);
  const hero = home?.banners[0];

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
      <section className="bg-ink text-white">
        <Container className="grid items-center gap-10 py-14 md:grid-cols-2 md:py-20">
          <div>
            <p className="text-accent-500 text-sm font-semibold uppercase tracking-widest">
              Beauty &amp; pharmacy
            </p>
            <h1 className="mt-4 text-balance text-4xl font-black tracking-tight sm:text-6xl">
              {hero?.title ?? "Genuine beauty and health care, delivered."}
            </h1>
            <p className="mt-6 max-w-md text-lg text-white/70">
              {hero?.subtitle ??
                "Skincare, makeup, hair care, fragrance, vitamins and everyday health essentials from brands you trust."}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={hero?.link ?? "/shop"}
                className="text-ink inline-flex h-12 items-center rounded-lg bg-white px-6 font-semibold hover:bg-white/90"
              >
                {hero?.ctaLabel ?? "Shop now"}
              </Link>
              <Link
                href="/shop"
                className="inline-flex h-12 items-center rounded-lg border border-white/30 px-6 font-semibold hover:bg-white/10"
              >
                Browse everything
              </Link>
            </div>
          </div>
          {hero && (
            <div className="relative hidden aspect-[16/9] overflow-hidden rounded-2xl md:block">
              <Image
                src={hero.imageUrl}
                alt=""
                fill
                priority
                sizes="50vw"
                className="object-cover"
              />
            </div>
          )}
        </Container>
      </section>

      {categories && categories.length > 0 && (
        <section>
          <Container className="pt-14">
            <h2 className="text-2xl font-bold tracking-tight">Shop by category</h2>
            <div
              className={`mt-6 grid grid-cols-2 gap-4 ${categories.length === 5 ? "md:grid-cols-3 lg:grid-cols-5" : "lg:grid-cols-4"}`}
            >
              {categories.map((c, i) => (
                <Link
                  key={c.id}
                  href={`/categories/${c.slug}`}
                  className={`${TILE_TONES[i % TILE_TONES.length]} group relative flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-xl p-5 text-white`}
                >
                  {c.imageUrl && (
                    <>
                      <Image
                        src={c.imageUrl}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 20vw, 50vw"
                        // On phones the first tiles are the largest thing on screen.
                        priority={i < 2}
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                    </>
                  )}
                  <span className="relative text-lg font-bold group-hover:underline">{c.name}</span>
                  <span className="relative text-sm text-white/80">
                    {c.productCount} {c.productCount === 1 ? "product" : "products"}
                  </span>
                </Link>
              ))}
            </div>
          </Container>
        </section>
      )}

      {newArrivals.data.length > 0 && (
        <Section title="New arrivals" href="/collections/new-arrivals" linkLabel="See all new">
          <ProductGrid products={newArrivals.data} />
        </Section>
      )}

      <section>
        <Container className="grid gap-4 md:grid-cols-3">
          {perks.map(({ icon: Icon, title, body }) => (
            <Card key={title} className="flex gap-4">
              <Icon className="text-brand-600 shrink-0" />
              <div>
                <h3 className="font-semibold">{title}</h3>
                <p className="text-muted mt-1 text-sm">{body}</p>
              </div>
            </Card>
          ))}
        </Container>
      </section>

      {bestSellers.data.length > 0 && (
        <Section
          title="Best sellers"
          href="/collections/best-sellers"
          linkLabel="See all best sellers"
        >
          <ProductGrid products={bestSellers.data} />
        </Section>
      )}

      <Container>
        <RecentlyViewed />
      </Container>
    </>
  );
}
