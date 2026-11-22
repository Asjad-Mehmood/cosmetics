import type { ProductCardDTO, ProductDetailDTO, StockStatus, VariantDTO } from "@store/types";
import { toMajor } from "@store/types";
import { Container } from "@store/ui";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BoughtTogether } from "@/components/product/bought-together";
import { ProductDetails, type DetailSection } from "@/components/product/product-details";
import { ProductRail } from "@/components/product/product-rail";
import { ProductView } from "@/components/product/product-view";
import { RecentlyViewed } from "@/components/product/recently-viewed";
import { Reviews } from "@/components/product/reviews";
import { Breadcrumbs } from "@/components/shop/product-listing";
import { siteConfig } from "@/lib/config";
import { baseOpenGraph, jsonLdHtml, metaDescription, pageTitle } from "@/lib/seo";
import { getData, getDataSafe } from "@/lib/server-api";

type Props = { params: Promise<{ slug: string }> };

const getProduct = (slug: string) =>
  getData<ProductDetailDTO>(`/products/${encodeURIComponent(slug)}`);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProduct((await params).slug);
  if (!product) return {};
  const title = pageTitle(product.seoTitle, product.title);
  const description = metaDescription(product.seoDescription ?? product.description);
  const images = product.images
    .slice(0, 4)
    .map((i) => ({ url: i.url, alt: i.alt ?? product.title }));
  return {
    title,
    description,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: { ...baseOpenGraph, title, description, images },
    twitter: { card: "summary_large_image", title, description, images: images.map((i) => i.url) },
    other: {
      "product:price:amount": String(toMajor(product.price)),
      "product:price:currency": siteConfig.currency,
      "product:availability": product.inStock ? "in stock" : "out of stock",
    },
  };
}

const AVAILABILITY: Record<StockStatus, string> = {
  in_stock: "https://schema.org/InStock",
  low_stock: "https://schema.org/LimitedAvailability",
  out_of_stock: "https://schema.org/OutOfStock",
};

/**
 * schema.org Product data, so search results can show the price, stock,
 * rating and return window. One Offer per variant (size/shade) with its SKU.
 */
function productJsonLd(p: ProductDetailDTO) {
  const url = `${siteConfig.url}/products/${p.slug}`;
  const returnPolicy = {
    "@type": "MerchantReturnPolicy",
    applicableCountry: "PK",
    returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
    merchantReturnDays: 7,
    returnMethod: "https://schema.org/ReturnByMail",
    url: `${siteConfig.url}/policies/returns`,
  };
  const variantName = (v: VariantDTO) =>
    [v.size, v.color].filter((x) => x && !/^(default|one size|standard)$/i.test(x)).join(" / ");
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.title,
    description: metaDescription(p.description, 5000),
    image: p.images.map((i) => i.url),
    url,
    sku: p.variants[0]?.sku,
    ...(p.categories[0] ? { category: p.categories[0].name } : {}),
    offers: (p.variants.length ? p.variants : [null]).map((v) => ({
      "@type": "Offer",
      url,
      priceCurrency: siteConfig.currency,
      price: toMajor(v?.price ?? p.price),
      itemCondition: "https://schema.org/NewCondition",
      availability: v
        ? AVAILABILITY[v.stockStatus]
        : p.inStock
          ? AVAILABILITY.in_stock
          : AVAILABILITY.out_of_stock,
      ...(v
        ? { sku: v.sku, ...(variantName(v) ? { name: `${p.title} (${variantName(v)})` } : {}) }
        : {}),
      seller: { "@type": "Organization", name: siteConfig.name },
      hasMerchantReturnPolicy: returnPolicy,
    })),
    ...(p.reviewCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: Number(p.avgRating.toFixed(1)),
            reviewCount: p.reviewCount,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
  };
}

function detailSections(product: ProductDetailDTO): DetailSection[] {
  return [
    { title: "Description", body: product.description },
    product.ingredients && { title: "Ingredients", body: product.ingredients },
    product.howToUse && { title: "How to use", body: product.howToUse },
    product.warnings && { title: "Warnings", body: product.warnings },
    {
      title: "Delivery & returns",
      body: "Delivered in 1-2 working days in Lahore and 2-5 working days elsewhere, with Cash on Delivery everywhere.\n\nUnopened beauty and personal care items can be returned within 7 days of delivery. For hygiene and safety, opened items and medicines can only be returned if they arrive damaged, expired or wrong.",
    },
  ].filter(Boolean) as DetailSection[];
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();
  const related = await getDataSafe<ProductCardDTO[]>(
    `/products/${encodeURIComponent(slug)}/related`,
    [],
  );
  const category = product.categories[0];

  return (
    <Container className="pb-8 pt-4 sm:py-8">
      <script
        type="application/ld+json"
        // JSON.stringify output is safe here apart from "<", which jsonLdHtml escapes.
        dangerouslySetInnerHTML={jsonLdHtml(productJsonLd(product))}
      />
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          category
            ? { label: category.name, href: `/categories/${category.slug}` }
            : { label: "Shop", href: "/shop" },
          { label: product.title },
        ]}
      />
      <ProductView product={product} />
      <BoughtTogether product={product} related={related} />
      <ProductDetails sections={detailSections(product)} />
      <Reviews slug={product.slug} />

      {related.length > 0 && (
        <div className="mt-16">
          <ProductRail title="You may also like" products={related} />
        </div>
      )}
      <RecentlyViewed current={product.slug} />
    </Container>
  );
}
