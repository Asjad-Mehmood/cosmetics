import type { Metadata } from "next";
import { Breadcrumbs, ProductListing } from "@/components/shop/product-listing";
import type { SearchParams } from "@/lib/listing";

export const metadata: Metadata = {
  title: "Offers",
  description: "Discounts on skincare, makeup, hair care, fragrance and health essentials.",
  alternates: { canonical: "/offers" },
};

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
