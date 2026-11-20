import type { Metadata } from "next";
import { ProductListing } from "@/components/shop/product-listing";
import type { SearchParams } from "@/lib/listing";

export const metadata: Metadata = {
  title: "Shop all products",
  description: "Browse skincare, makeup, hair care, fragrance, vitamins and health essentials.",
  alternates: { canonical: "/shop" },
};

export default async function ShopPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
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
