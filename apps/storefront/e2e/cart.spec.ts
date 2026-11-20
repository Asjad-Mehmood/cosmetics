import { expect, test } from "@playwright/test";
import { addToCart, findVariant, selectVariant, uniqueEmail } from "./helpers";

test("asks for a size before adding to cart", async ({ page }) => {
  await page.goto("/products/vitamin-c-brightening-serum");
  await page.getByRole("button", { name: "Add to cart", exact: true }).click();
  await expect(page.locator("#size-error")).toHaveText("Please choose a size.");
});

test("add, change quantity and remove items", async ({ page, request }) => {
  const { slug, title, variant } = await findVariant(request, "available");
  const drawer = await addToCart(page, slug, variant);

  await expect(drawer.getByTestId("cart-line")).toHaveCount(1);
  await expect(drawer.getByText(title)).toBeVisible();
  await expect(page.getByTestId("cart-count")).toHaveText("1");
  const subtotal = drawer.getByTestId("cart-subtotal");
  const single = Number((await subtotal.textContent())!.replace(/[^\d]/g, ""));

  await drawer.getByRole("button", { name: "Increase quantity" }).click();
  await expect(page.getByTestId("cart-count")).toHaveText("2");
  await expect(subtotal).toHaveText(new RegExp(`${(single * 2).toLocaleString("en-US")}$`));

  await drawer.getByRole("link", { name: "View full cart" }).click();
  await expect(page).toHaveURL(/\/cart$/);
  await page.getByRole("button", { name: new RegExp(`^Remove ${title}`) }).click();
  await expect(page.locator("#main").getByText("Your cart is empty")).toBeVisible();
  await expect(page.getByTestId("cart-count")).toHaveCount(0);
});

test("the cart survives a page reload", async ({ page, request }) => {
  const { slug, variant } = await findVariant(request, "available");
  await addToCart(page, slug, variant);
  await page.reload();
  await expect(page.getByTestId("cart-count")).toHaveText("1");
});

test("sold-out sizes offer a back-in-stock email instead of add to cart", async ({
  page,
  request,
}) => {
  const { slug, variant } = await findVariant(request, "out_of_stock");
  await selectVariant(page, slug, variant);

  await expect(page.getByRole("button", { name: "Add to cart", exact: true })).toHaveCount(0);
  const main = page.locator("#main");
  await main.getByLabel("Email address", { exact: true }).fill(uniqueEmail());
  await main.getByRole("button", { name: "Notify me" }).click();
  await expect(page.getByRole("status").filter({ hasText: "back in stock" })).toBeVisible();
});

test("low stock shows how many are left", async ({ page, request }) => {
  const { slug, variant } = await findVariant(request, "low_stock");
  await selectVariant(page, slug, variant);
  await expect(page.getByText(/Hurry, only \d+ left in/)).toBeVisible();
});

test("quick add puts a single-option product in the cart from the grid", async ({ page }) => {
  await page.goto("/categories/skincare");
  await page.getByRole("button", { name: "Add to cart: Hyaluronic Acid Hydrating Serum" }).click();
  const drawer = page.getByRole("dialog", { name: /Your cart/ });
  await expect(drawer.getByTestId("cart-line")).toHaveCount(1);
  await expect(drawer.getByText("Hyaluronic Acid Hydrating Serum")).toBeVisible();
  // Rs 1,899 is below the free-delivery threshold, so the bar shows what's left.
  await expect(drawer.getByTestId("free-delivery")).toContainText("more for free delivery");
  // Products with a choice to make open the product page instead.
  await drawer.getByRole("button", { name: "Close" }).click();
  await page.getByRole("link", { name: "Choose options for Vitamin C Brightening Serum" }).click();
  await expect(page).toHaveURL(/\/products\/vitamin-c-brightening-serum$/);
});

test("buy now adds the item and goes straight to checkout", async ({ page }) => {
  await page.goto("/products/argan-oil-repair-shampoo");
  await page.getByRole("button", { name: /^Size 250 ml/ }).click();
  await page.getByRole("button", { name: "Buy now" }).click();
  await expect(page).toHaveURL(/\/checkout$/);
  await expect(page.getByText("Argan Oil Repair Shampoo").first()).toBeVisible();
});
