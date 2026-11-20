import request from "supertest";
import { describe, expect, it } from "vitest";
import { prisma } from "../src/lib/prisma";
import { app, createTestProduct } from "./helpers";

const get = (path: string) => request(app).get(`/api/v1${path}`);

type Card = {
  slug: string;
  price: number;
  colors: { name: string }[];
  sizesInStock: string[];
  inStock: boolean;
};

describe("GET /products", () => {
  it("returns paginated published products with card fields", async () => {
    // Scoped to a seeded category: other test files create products concurrently.
    const res = await get("/products?category=skincare&limit=2");
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.meta).toMatchObject({ page: 1, limit: 2 });
    expect(res.body.meta.totalPages).toBe(Math.ceil(res.body.meta.total / 2));

    const card = res.body.data[0];
    expect(card).toEqual(
      expect.objectContaining({
        slug: expect.any(String),
        price: expect.any(Number),
        image: expect.objectContaining({ url: expect.any(String) }),
        colors: expect.any(Array),
        inStock: expect.any(Boolean),
      }),
    );
    // Raw stock levels are never exposed publicly.
    expect(JSON.stringify(res.body)).not.toMatch(/"stock"|"reserved"/);
  });

  it("never lists draft or archived products", async () => {
    const draft = await createTestProduct({ status: "DRAFT" });
    const res = await get(`/products?q=${draft.title}`);
    expect(res.body.data).toHaveLength(0);
    // the seeded draft product too
    const all = await get("/products?limit=100");
    expect(all.body.data.map((p: Card) => p.slug)).not.toContain("daily-multivitamin-tablets");
  });

  it("filters by category (including the seeded catalogue)", async () => {
    const res = await get("/products?category=skincare&limit=50");
    const slugs = res.body.data.map((p: Card) => p.slug).sort();
    expect(slugs).toEqual([
      "daily-sunscreen-spf-50",
      "hyaluronic-hydrating-serum",
      "vitamin-c-brightening-serum",
    ]);
  });

  it("filters by collection and category together", async () => {
    const res = await get("/products?collection=new-arrivals&category=skincare&limit=50");
    expect(res.body.data.map((p: Card) => p.slug)).toEqual(["hyaluronic-hydrating-serum"]);
  });

  it("filters by pack size and shade on the same variant", async () => {
    const res = await get("/products?size=3.5%20g&color=Nude%20Rose&limit=50");
    expect(res.body.data.map((p: Card) => p.slug)).toEqual(["velvet-matte-lipstick"]);
    const sizes = await get("/products?size=100%20ml&category=skincare&limit=50");
    expect(sizes.body.data.map((p: Card) => p.slug)).toEqual(["daily-sunscreen-spf-50"]);
  });

  it("filters by price range (minor units)", async () => {
    const res = await get("/products?minPrice=400000&maxPrice=500000&limit=50");
    expect(res.body.data.length).toBeGreaterThan(0);
    const products = await prisma.product.findMany({
      where: { slug: { in: res.body.data.map((p: Card) => p.slug) } },
      select: { basePrice: true },
    });
    for (const p of products) {
      expect(p.basePrice).toBeGreaterThanOrEqual(400000);
      expect(p.basePrice).toBeLessThanOrEqual(500000);
    }
  });

  it("inStock=true excludes products whose only matching variants are sold out", async () => {
    const product = await createTestProduct({ stock: 0 });
    const res = await get(`/products?q=${encodeURIComponent(product.title)}&inStock=true`);
    expect(res.body.data).toHaveLength(0);
    const without = await get(`/products?q=${encodeURIComponent(product.title)}`);
    expect(without.body.data[0]).toMatchObject({ inStock: false, sizesInStock: [] });
  });

  it("treats reserved units as unavailable", async () => {
    const product = await createTestProduct({ stock: 2 });
    await prisma.productVariant.updateMany({
      where: { productId: product.id },
      data: { reserved: 2 },
    });
    const res = await get(`/products?q=${encodeURIComponent(product.title)}&inStock=true`);
    expect(res.body.data).toHaveLength(0);
  });

  it("searches title and description case-insensitively", async () => {
    const res = await get("/products?q=SUNSCREEN");
    expect(res.body.data.map((p: Card) => p.slug)).toContain("daily-sunscreen-spf-50");
    // "ferulic" only appears in the serum's description
    const desc = await get("/products?q=Ferulic");
    expect(desc.body.data.map((p: Card) => p.slug)).toContain("vitamin-c-brightening-serum");
  });

  it.each([
    ["price_asc", (a: number, b: number) => a <= b],
    ["price_desc", (a: number, b: number) => a >= b],
  ])("sorts by %s", async (sort, inOrder) => {
    const res = await get(`/products?category=skincare&sort=${sort}&limit=50`);
    const prices = res.body.data.map((p: Card) => p.price);
    for (let i = 1; i < prices.length; i++) expect(inOrder(prices[i - 1], prices[i])).toBe(true);
  });

  it("rejects invalid filters with 422", async () => {
    expect((await get(`/products?size=${"x".repeat(41)}`)).status).toBe(422);
    expect((await get("/products?sort=cheapest")).status).toBe(422);
    expect((await get("/products?limit=1000")).status).toBe(422);
  });
});

describe("GET /products/:slug", () => {
  it("returns details with sorted variants, images and taxonomy", async () => {
    const res = await get("/products/vitamin-c-brightening-serum");
    expect(res.status).toBe(200);
    const p = res.body.data;
    expect(p.sizes).toEqual(["15 ml", "30 ml"]);
    expect(p.colors.map((c: { name: string }) => c.name)).toEqual(["Standard"]);
    expect(p.variants.map((v: { size: string; price: number }) => [v.size, v.price])).toEqual([
      ["15 ml", 249900],
      ["30 ml", 399900],
    ]);
    expect(p).toMatchObject({ price: 249900, hasPriceRange: true });
    expect(p.ingredients).toContain("Ascorbic Acid");
    expect(p.howToUse).toEqual(expect.any(String));
    expect(p.warnings).toContain("Patch test");
    expect(p.categories).toEqual([expect.objectContaining({ slug: "skincare" })]);
    expect(p.images.length).toBeGreaterThan(0);

    const lipstick = (await get("/products/velvet-matte-lipstick")).body.data;
    expect(lipstick.colors.map((c: { name: string }) => c.name)).toEqual([
      "Nude Rose",
      "Classic Red",
      "Berry Wine",
    ]);
  });

  it("only exposes a count when stock is low", async () => {
    const product = await createTestProduct({ stock: 2 });
    await prisma.productVariant.update({
      where: { id: product.variants[0]!.id },
      data: { stock: 50 },
    });
    await prisma.productVariant.update({
      where: { id: product.variants[1]!.id },
      data: { stock: 0 },
    });

    const res = await get(`/products/${product.slug}`);
    const bySize = Object.fromEntries(
      res.body.data.variants.map((v: { size: string }) => [v.size, v]),
    );
    expect(bySize[product.variants[0]!.size]).toMatchObject({
      stockStatus: "in_stock",
      lowStockCount: null,
    });
    expect(bySize[product.variants[1]!.size]).toMatchObject({
      stockStatus: "out_of_stock",
      lowStockCount: null,
    });
    expect(bySize[product.variants[2]!.size]).toMatchObject({
      stockStatus: "low_stock",
      lowStockCount: 2,
    });
  });

  it("uses variant price overrides and reports a price range", async () => {
    const product = await createTestProduct({ price: 300000 });
    await prisma.productVariant.update({
      where: { id: product.variants[0]!.id },
      data: { price: 350000 },
    });
    const res = await get(`/products/${product.slug}`);
    expect(res.body.data).toMatchObject({ price: 300000, hasPriceRange: true });
  });

  it("returns 404 for drafts and unknown slugs", async () => {
    expect((await get("/products/daily-multivitamin-tablets")).status).toBe(404);
    expect((await get("/products/does-not-exist")).status).toBe(404);
  });

  it("lists related products without the product itself", async () => {
    const res = await get("/products/vitamin-c-brightening-serum/related");
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data.map((p: Card) => p.slug)).not.toContain("vitamin-c-brightening-serum");
  });
});

describe("categories, collections and filters", () => {
  it("returns the category tree with published product counts", async () => {
    const res = await get("/categories");
    // Other test files add products concurrently, so compare with the database
    // rather than hard-coded numbers. Only ACTIVE products count (the seeded
    // "health-wellness" category also holds a DRAFT product).
    for (const slug of ["skincare", "health-wellness"]) {
      const node = res.body.data.find((c: { slug: string }) => c.slug === slug);
      const [active, all] = await Promise.all([
        prisma.product.count({ where: { status: "ACTIVE", categories: { some: { slug } } } }),
        prisma.product.count({ where: { categories: { some: { slug } } } }),
      ]);
      expect(node.productCount).toBe(active);
      if (slug === "health-wellness") expect(all).toBeGreaterThan(active);
    }
  });

  it("gets a single category and collection", async () => {
    expect((await get("/categories/makeup")).body.data.slug).toBe("makeup");
    expect((await get("/collections/new-arrivals")).body.data.productCount).toBeGreaterThan(0);
    expect((await get("/categories/nope")).status).toBe(404);
  });

  it("lists only featured collections when asked", async () => {
    const res = await get("/collections?featured=true");
    expect(res.body.data.every((c: { isFeatured: boolean }) => c.isFeatured)).toBe(true);
    expect(res.body.data.map((c: { slug: string }) => c.slug)).not.toContain("daily-essentials");
  });

  it("returns filter options scoped to a category", async () => {
    const res = await get("/filters?category=skincare");
    expect(res.body.data).toEqual({
      sizes: ["15 ml", "30 ml", "50 ml", "100 ml"],
      colors: [{ name: "Standard", hex: "#E5E7EB" }],
      price: { min: 149900, max: 249900 },
    });
    const makeup = await get("/filters?category=makeup");
    expect(makeup.body.data.colors).toEqual(
      expect.arrayContaining([
        { name: "Nude Rose", hex: "#C98B83" },
        { name: "Classic Red", hex: "#B3262E" },
      ]),
    );
  });
});
