import type { Metadata } from "next";
import { ProductListing } from "@/components/shop/product-listing";
import type { SearchParams } from "@/lib/listing";
import { listingMetadata } from "@/lib/seo";

type Props = { searchParams: Promise<SearchParams> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  return {
    title: "Shop Skincare, Makeup & Health Products Online in Pakistan",
    description:
      "Shop skincare, makeup, hair care, fragrance, vitamins and health essentials online. Delivery across Pakistan with Cash on Delivery.",
    ...listingMetadata("/shop", await searchParams),
  };
}

export default async function ShopPage({ searchParams }: Props) {
  return (
    <ProductListing
      title="All products"
      eyebrow="Shop"
      description="Genuine skincare, makeup, hair care, fragrance, vitamins and health essentials, delivered across Pakistan."
      pathname="/shop"
      searchParams={await searchParams}
    />
  );
}
