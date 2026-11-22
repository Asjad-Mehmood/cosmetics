import type { Metadata } from "next";
import { Breadcrumbs, ProductListing } from "@/components/shop/product-listing";
import type { SearchParams } from "@/lib/listing";
import { listingMetadata } from "@/lib/seo";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  return {
    title: "Offers & Discounts on Beauty and Health Products",
    description:
      "Today's discounts on skincare, makeup, hair care, fragrance and health essentials, delivered across Pakistan with Cash on Delivery.",
    ...listingMetadata("/offers", await searchParams),
  };
}

export default async function OffersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  return (
    <ProductListing
      title="Offers"
      eyebrow="Save more"
      description="Genuine products at lower prices, while stocks last."
      pathname="/offers"
      searchParams={await searchParams}
      lockedOnSale
      showCategories={false}
      breadcrumbs={<Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Offers" }]} />}
    />
  );
}
