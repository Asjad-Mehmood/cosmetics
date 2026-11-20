import { expect, test } from "@playwright/test";

test("menu drawer opens and navigates", async ({ page }) => {
  await page.goto("/");
  // The menu button works once the page's scripts have loaded (see browse.spec.ts).
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Open menu" }).click();
  const menu = page.getByRole("dialog", { name: "Menu" });
  await menu.getByRole("link", { name: "Hair Care" }).click();
  await expect(page).toHaveURL(/\/categories\/hair-care$/);
  await expect(menu).toBeHidden();
});

test("filters open in a drawer on small screens", async ({ page }) => {
  await page.goto("/shop");
  await page.getByRole("button", { name: /^Filters/ }).click();
  const drawer = page.getByRole("dialog", { name: "Filters" });
  await drawer.getByRole("button", { name: "50 ml", exact: true }).click();
  await expect(page).toHaveURL(/size=50(\+|%20)ml/);
  await drawer.getByRole("button", { name: /^Show \d+ results?$/ }).click();
  await expect(drawer).toBeHidden();
  await expect(page.getByRole("button", { name: /^Filters \(1\)/ })).toBeVisible();
});

test("no horizontal scrolling on key pages", async ({ page }) => {
  for (const path of ["/", "/shop", "/products/velvet-matte-lipstick", "/cart", "/login"]) {
    await page.goto(path);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(overflow, path).toBe(false);
  }
});

test("the bottom tab bar opens categories and the cart", async ({ page }) => {
  await page.goto("/");
  // The tab bar works once the page's scripts have loaded.
  await page.waitForLoadState("networkidle");
  const tabs = page.getByRole("navigation", { name: "Quick links" });
  await tabs.getByRole("button", { name: "Categories" }).click();
  const menu = page.getByRole("dialog", { name: "Menu" });
  await expect(menu.getByRole("link", { name: "Skincare" })).toBeVisible();
  await menu.getByRole("button", { name: "Close" }).click();
  await tabs.getByRole("button", { name: /Cart/ }).click();
  await expect(page.getByRole("dialog", { name: /Your cart/ })).toBeVisible();
});
