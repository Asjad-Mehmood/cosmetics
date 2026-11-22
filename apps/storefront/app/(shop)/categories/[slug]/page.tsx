import type { CategoryDTO } from "@store/types";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs, ProductListing } from "@/components/shop/product-listing";
import { siteConfig } from "@/lib/config";
import type { SearchParams } from "@/lib/listing";
import { getData } from "@/lib/server-api";
import { baseOpenGraph, listingMetadata, metaDescription } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<SearchParams> };

const getCategory = (slug: string) =>
  getData<CategoryDTO>(`/categories/${encodeURIComponent(slug)}`, { revalidate: 300 });

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const category = await getCategory((await params).slug);
  if (!category) return {};
  return {
    title: `${category.name}: Buy Online in Pakistan`,
    description: metaDescription(
      category.description ??
        `Shop ${category.name.toLowerCase()} online at ${siteConfig.name}. Delivery across Pakistan with Cash on Delivery.`,
    ),
    openGraph: {
      ...baseOpenGraph,
      title: category.name,
      ...(category.imageUrl ? { images: [{ url: category.imageUrl, alt: category.name }] } : {}),
    },
    ...listingMetadata(`/categories/${category.slug}`, await searchParams),
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) notFound();

  return (
    <ProductListing
      title={category.name}
      description={category.description}
      image={category.imageUrl}
      eyebrow="Category"
      pathname={`/categories/${slug}`}
      searchParams={await searchParams}
      scope={{ category: slug }}
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Shop", href: "/shop" },
            { label: category.name },
          ]}
        />
      }
    />
  );
}
