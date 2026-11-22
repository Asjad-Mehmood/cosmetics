import type { CategoryDTO, CollectionDTO, ProductCardDTO } from "@store/types";
import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/config";
import { getDataSafe, getList } from "@/lib/server-api";

export const revalidate = 3600;

async function allProducts(): Promise<ProductCardDTO[]> {
  const products: ProductCardDTO[] = [];
  for (let page = 1; page <= 50; page++) {
    const res = await getList<ProductCardDTO>(`/products?limit=100&page=${page}`, {
      revalidate: 3600,
    });
    products.push(...res.data);
    if (page >= res.meta.totalPages) break;
  }
  return products;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories, collections] = await Promise.all([
    allProducts().catch(() => []),
    getDataSafe<CategoryDTO[]>("/categories", []),
    getDataSafe<CollectionDTO[]>("/collections", []),
  ]);
  const url = (path: string) => `${siteConfig.url}${path}`;
  const flatten = (cats: CategoryDTO[]): CategoryDTO[] =>
    cats.flatMap((c) => [c, ...flatten(c.children)]);

  return [
    { url: url("/"), changeFrequency: "daily", priority: 1 },
    { url: url("/shop"), changeFrequency: "daily", priority: 0.9 },
    { url: url("/offers"), changeFrequency: "daily", priority: 0.8 },
    { url: url("/prescription"), changeFrequency: "monthly", priority: 0.7 },
    // Empty categories and collections are thin pages; leave them out until they have products.
    ...flatten(categories)
      .filter((c) => c.productCount > 0)
      .map((c) => ({
        url: url(`/categories/${c.slug}`),
        changeFrequency: "weekly" as const,
        priority: 0.8,
        ...(c.imageUrl ? { images: [c.imageUrl] } : {}),
      })),
    ...collections
      .filter((c) => c.productCount > 0)
      .map((c) => ({
        url: url(`/collections/${c.slug}`),
        changeFrequency: "weekly" as const,
        priority: 0.8,
        ...(c.bannerUrl ? { images: [c.bannerUrl] } : {}),
      })),
    // Product photos go in the sitemap too, so they show in Google Images.
    ...products.map((p) => ({
      url: url(`/products/${p.slug}`),
      changeFrequency: "weekly" as const,
      priority: 0.7,
      images: [p.image?.url, p.hoverImage?.url].filter((i): i is string => !!i),
    })),
    ...[
      "/faq",
      "/about",
      "/contact",
      "/policies/shipping",
      "/policies/returns",
      "/policies/privacy",
      "/policies/terms",
    ].map((p) => ({
      url: url(p),
      changeFrequency: "monthly" as const,
      priority: 0.3,
    })),
  ];
}
