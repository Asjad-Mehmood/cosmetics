import { expect, test } from "@playwright/test";

test("vouchers can be applied straight from the cart", async ({ page }) => {
  await page.goto("/products/bloom-eau-de-parfum");
  await page.getByRole("button", { name: /^Size 50 ml/ }).click();
  await page.getByRole("button", { name: "Add to cart", exact: true }).click();
  const drawer = page.getByRole("dialog", { name: /Your cart/ });
  await drawer.getByRole("button", { name: "Apply voucher WELCOME10" }).click();
  await expect(drawer.getByText(/Discount \(WELCOME10\)/)).toBeVisible();
  await expect(drawer.getByRole("button", { name: "Apply voucher WELCOME10" })).toHaveText(
    /Applied/,
  );
});

test("frequently bought together adds the whole set", async ({ page }) => {
  await page.goto("/products/vitamin-c-brightening-serum");
  const box = page.getByRole("region", { name: "Frequently bought together" });
  await expect(box.getByRole("checkbox")).toHaveCount(3);
  await box.getByRole("button", { name: "Add all to cart" }).click();
  const drawer = page.getByRole("dialog", { name: /Your cart/ });
  await expect(drawer.getByTestId("cart-line")).toHaveCount(3);
});

test("the delivery box shows arrival dates", async ({ page }) => {
  await page.goto("/products/digital-thermometer");
  await expect(page.getByText(/^Arrives \w{3} \d+/).first()).toBeVisible();
});

test("search can be limited to one category", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Search in").selectOption("skincare");
  await page.getByRole("combobox", { name: "Search products" }).fill("serum");
  await page.getByRole("button", { name: "Search products" }).click();
  await expect(page).toHaveURL(/\/search\?q=serum&category=skincare/);
  await expect(page.getByText("In Skincare")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Vitamin C Brightening Serum" })).toBeVisible();
});

test("just for you shows the catalogue with a count", async ({ page }) => {
  await page.goto("/");
  const section = page.getByRole("region", { name: "Just for you" });
  await expect(section.getByRole("article").first()).toBeVisible();
  // The demo catalogue fits on one page, so there is nothing more to load.
  await expect(section.getByText(/^Showing (\d+) of \1$/)).toBeVisible();
  await expect(section.getByRole("button", { name: "Load more" })).toHaveCount(0);
});
