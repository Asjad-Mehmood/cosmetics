import { Container } from "@store/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/lib/config";
import { PageHeader } from "@/components/content/page-header";

export const metadata: Metadata = {
  title: "About us",
  description: `${siteConfig.name} is an online beauty and pharmacy store for Pakistan: skincare, makeup, hair care, fragrance, vitamins and health essentials with Cash on Delivery.`,
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <Container className="max-w-4xl py-8 sm:py-12">
      <PageHeader title={`About ${siteConfig.name}`} eyebrow="Our story" />
      <div className="space-y-4 text-lg leading-relaxed">
        <p>
          {siteConfig.name} is an online beauty and pharmacy store for Pakistan: skincare, makeup,
          hair care, fragrance, vitamins and everyday health essentials in one place.
        </p>
        <p className="text-muted">
          Everything we sell is genuine. We buy only from brands and their authorised distributors,
          store products away from heat and sunlight, and check expiry dates before every parcel
          leaves us.
        </p>
        <p className="text-muted">
          Not sure what suits your skin, or how a product should be used? Contact us and our team
          will help you choose.
        </p>
        <p className="text-muted">
          We deliver to every city in Pakistan with Cash on Delivery, and unopened beauty and
          personal care items can be returned within 7 days.
        </p>
      </div>
      <Link
        href="/shop"
        className="bg-brand-600 hover:bg-brand-700 mt-10 inline-flex h-12 items-center rounded-full px-7 text-sm font-semibold text-white"
      >
        Shop all products
      </Link>
    </Container>
  );
}
