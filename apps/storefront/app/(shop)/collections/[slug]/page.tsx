import type { CollectionDTO } from "@store/types";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs, ProductListing } from "@/components/shop/product-listing";
import { siteConfig } from "@/lib/config";
import type { SearchParams } from "@/lib/listing";
import { getData } from "@/lib/server-api";
import { baseOpenGraph, listingMetadata, metaDescription } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<SearchParams> };

const getCollection = (slug: string) =>
  getData<CollectionDTO>(`/collections/${encodeURIComponent(slug)}`, { revalidate: 300 });

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const collection = await getCollection((await params).slug);
  if (!collection) return {};
  return {
    title: `${collection.name}: Buy Online in Pakistan`,
    description: metaDescription(
      collection.description ??
        `Shop ${collection.name.toLowerCase()} online at ${siteConfig.name}. Delivery across Pakistan with Cash on Delivery.`,
    ),
    openGraph: {
      ...baseOpenGraph,
      title: collection.name,
      ...(collection.bannerUrl
        ? { images: [{ url: collection.bannerUrl, alt: collection.name }] }
        : {}),
    },
    ...listingMetadata(`/collections/${collection.slug}`, await searchParams),
  };
}

export default async function CollectionPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const collection = await getCollection(slug);
  if (!collection) notFound();

  return (
    <ProductListing
      title={collection.name}
      description={collection.description}
      image={collection.bannerUrl}
      eyebrow="Collection"
      pathname={`/collections/${slug}`}
      searchParams={await searchParams}
      scope={{ collection: slug }}
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Shop", href: "/shop" },
            { label: collection.name },
          ]}
        />
      }
    />
  );
}
