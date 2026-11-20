import { expect, test } from "@playwright/test";

test("home page shows the hero, categories and products", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Shop by category" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Best sellers" })).toBeVisible();
  await expect(page.locator("article").first()).toBeVisible();
});

test("mega menu leads to a category page that only lists that category", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("navigation", { name: "Main" })
    .getByRole("button", { name: "All categories" })
    .click();
  await page
    .locator("#mega-menu")
    .getByRole("link", { name: /Skincare/ })
    .click();

  await expect(page).toHaveURL(/\/categories\/skincare$/);
  await expect(page.getByRole("heading", { level: 1, name: "Skincare" })).toBeVisible();
  await expect(page.locator("#main").getByText(/^3 products$/)).toBeVisible();
});

test("filters update the URL and results, and can be cleared", async ({ page }) => {
  await page.goto("/shop");
  // The filters work once the page's scripts have loaded.
  await page.waitForLoadState("networkidle");
  const count = page.locator("#main").getByText(/^\d+ products?$/);
  const before = await count.textContent();

  // Retry until the filter panel is interactive.
  await expect(async () => {
    await page.getByRole("checkbox", { name: "Nude Rose" }).check();
    await expect(page).toHaveURL(/color=Nude/, { timeout: 2000 });
  }).toPass();
  await expect(count).toHaveText("1 product");
  await expect(page.getByRole("heading", { name: "Velvet Matte Lipstick" })).toBeVisible();

  await page.getByRole("button", { name: "Remove filter: Nude Rose" }).click();
  await expect(page).not.toHaveURL(/color=/);
  await expect(count).toHaveText(before!);
});

test("sorting by price orders the grid", async ({ page }) => {
  await page.goto("/shop");
  await page.getByLabel("Sort products").selectOption("price_asc");
  await expect(page).toHaveURL(/sort=price_asc/);
  await page.waitForLoadState("networkidle");
  const prices = await page.locator("article [data-price]").allTextContents();
  const values = prices.map((p) => Number(p.replace(/[^\d]/g, "")));
  expect(values).toEqual([...values].sort((a, b) => a - b));
});

test("search finds products", async ({ page }) => {
  await page.goto("/search");
  await page.getByRole("searchbox", { name: "Search products" }).fill("sunscreen");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  // Search runs on the server; allow for a busy machine when every test runs at once.
  await expect(page.getByRole("heading", { name: "Daily Sunscreen Lotion SPF 50" })).toBeVisible({
    timeout: 15_000,
  });
});

test("a missing product returns a real 404", async ({ page }) => {
  const res = await page.goto("/products/does-not-exist");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "We couldn’t find that page" })).toBeVisible();
});

test("product page: pack sizes have their own prices, and details are listed", async ({ page }) => {
  await page.goto("/products/vitamin-c-brightening-serum");
  // One shade only: no shade picker.
  await expect(page.getByText(/^Shade:/)).toBeHidden();
  await page.getByRole("button", { name: /^Size 30 ml/ }).click();
  await expect(page.getByText("Rs 3,999").first()).toBeVisible();
  for (const section of ["Ingredients", "How to use", "Warnings", "Delivery & returns"]) {
    await expect(page.getByRole("tab", { name: section })).toBeVisible();
  }
});

test("product page: shades switch with the swatches", async ({ page }) => {
  await page.goto("/products/velvet-matte-lipstick");
  await page.getByRole("button", { name: /^Classic Red/ }).click();
  await expect(page.getByText("Shade:")).toContainText("Classic Red");
  await expect(page.getByRole("button", { name: /^Classic Red/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("offers page lists only discounted products", async ({ page }) => {
  await page.goto("/offers");
  await expect(page.getByRole("heading", { level: 1, name: "Offers" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Velvet Matte Lipstick" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Vitamin C Brightening Serum" })).toHaveCount(0);
});
