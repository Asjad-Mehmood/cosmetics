import { expect, test, type Page } from "@playwright/test";

// The rest of the suite runs with "Reduce motion"; these tests check the motion itself.
test.use({ reducedMotion: "no-preference" });

/** Delays every page-data (RSC) request, like a slow phone connection. */
async function slowPageData(page: Page, ms = 1500) {
  // Clicks before the page's scripts have loaded are plain browser navigations.
  await page.waitForLoadState("networkidle");
  await page.route("**/*", async (route) => {
    if (route.request().headers()["rsc"]) await new Promise((r) => setTimeout(r, ms));
    await route.continue();
  });
}

test("a slow page switch shows the next page's skeleton and a progress bar at once", async ({
  page,
}) => {
  await page.goto("/");
  await slowPageData(page);
  const card = page.locator('main a[href^="/products/"]').first();
  const href = (await card.getAttribute("href"))!;

  // dispatchEvent: no hover first, so nothing was prefetched.
  await card.dispatchEvent("click", { button: 0 });
  await expect(page.getByTestId("route-skeleton")).toBeVisible({ timeout: 1000 });
  await expect(page.getByTestId("nav-progress")).toBeVisible({ timeout: 1000 });
  await expect(page.locator("main [aria-busy=true]")).toBeVisible();

  await page.waitForURL(`**${href}`);
  await expect(
    page.getByRole("button", { name: "Add to cart", exact: true }).first(),
  ).toBeVisible();
  await expect(page.getByTestId("route-skeleton")).toHaveCount(0);
  await expect(page.getByTestId("nav-progress")).toHaveCount(0, { timeout: 2000 });
});

test("hovering a link loads the next page in advance, so the click is instant", async ({
  page,
}) => {
  await page.goto("/");
  await slowPageData(page);
  const link = page.locator('header a[href^="/categories/"]:visible').first();
  const href = (await link.getAttribute("href"))!;

  // A full-page prefetch: page data (RSC) for the link, requested before any click.
  // (Next's own partial prefetches of visible links carry "next-router-prefetch".)
  const prefetched = page.waitForResponse(
    (r) =>
      new URL(r.url()).pathname === href &&
      !!r.request().headers()["rsc"] &&
      !r.request().headers()["next-router-prefetch"],
  );
  await link.hover();
  await prefetched;

  await link.click();
  await page.waitForURL(`**${href}`, { timeout: 1000 });
  await expect(page.getByTestId("route-skeleton")).toHaveCount(0);
});

test("links to the current page and new tabs start no page switch", async ({ page }) => {
  await page.goto("/shop");
  await page.waitForLoadState("networkidle");
  await page.locator('header a[href="/"]').first().dispatchEvent("click", {
    button: 0,
    ctrlKey: true,
  });
  await page.waitForTimeout(300);
  await expect(page.getByTestId("nav-progress")).toHaveCount(0);
  await expect(page.getByTestId("route-skeleton")).toHaveCount(0);
});

test("the cart drawer slides out before it disappears", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: /cart/i }).first().click();
  const drawer = page.locator('dialog[data-variant="right"]');
  await expect(drawer).toBeVisible();
  await expect(drawer).toHaveCSS("translate", "none");

  await page.keyboard.press("Escape");
  // Still on screen while it slides away, then gone.
  await expect(drawer).toBeVisible();
  await expect(drawer).toBeHidden();
});

test.describe("on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test("a bottom sheet closes when dragged down, and springs back after a short drag", async ({
    page,
  }) => {
    await page.goto("/shop");
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: /^Filters/ }).click();
    const sheet = page.getByRole("dialog", { name: "Filters" });
    // Measure the handle once the sheet has finished sliding up.
    await expect(sheet).toHaveCSS("translate", "none");
    const handle = (await sheet.getByRole("heading", { name: "Filters" }).boundingBox())!;
    const x = handle.x + handle.width / 2;

    const dragBy = async (dy: number) => {
      await page.mouse.move(x, handle.y);
      await page.mouse.down();
      await page.mouse.move(x, handle.y + dy, { steps: 8 });
      await page.mouse.up();
    };

    await dragBy(40);
    await expect(sheet).toHaveCSS("translate", "none");
    await expect(sheet).toBeVisible();

    await dragBy(240);
    await expect(sheet).toBeHidden();
  });
});

test("adding to cart shows ✓ Added, flies the photo to the cart, then opens the cart", async ({
  page,
}) => {
  await page.goto("/products/digital-thermometer");
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Add to cart", exact: true }).click();

  await expect(page.getByRole("button", { name: "Added" })).toBeVisible();
  await expect(page.locator("img[data-fly-ghost]")).toHaveCount(1);
  // GSAP's landing flourish: a ring and a "+1" at the cart icon.
  await expect(page.getByText("+1", { exact: true })).toBeAttached();
  // It lands, disappears and the cart drawer opens with the new count.
  await expect(page.getByRole("dialog", { name: /Your cart/ })).toBeVisible();
  await expect(page.locator("img[data-fly-ghost]")).toHaveCount(0);
  await expect(page.getByTestId("cart-count")).toHaveText(/\d+/);
  // The button goes back to normal after a moment.
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Add to cart", exact: true })).toBeVisible();
});

test("the hero's active dot fills up as the slideshow timer runs", async ({ page }) => {
  await page.goto("/");
  const bar = page.getByTestId("hero-progress");
  await expect(bar).toHaveCount(1);
  await expect
    .poll(() => bar.evaluate((el) => getComputedStyle(el).animationName))
    .toBe("hero-progress");
  // Hovering pauses it.
  await page.getByRole("region", { name: "Featured" }).hover();
  await expect
    .poll(() => bar.evaluate((el) => getComputedStyle(el).animationPlayState))
    .toBe("paused");
});

test("GSAP: sections below the fold come in when scrolled to, and only then", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  // GSAP has loaded and set up the scenes.
  await expect(page.locator("[data-gsap-hero]")).toHaveCount(1);
  const concerns = page.locator('[data-gsap="stagger"]').filter({ hasText: "Dark spots" });
  await expect(concerns).toHaveAttribute("data-gsap-on", "");
  const first = concerns.locator(".reveal-item").first();
  await expect(first).toHaveCSS("opacity", "0");
  await concerns.scrollIntoViewIfNeeded();
  await expect(first).toHaveCSS("opacity", "1");
  // Split headings keep their accessible name.
  await expect(page.getByRole("heading", { name: "Shop by concern" })).toBeVisible();
});

test("GSAP: the promise ticker scrolls on its own", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("section[aria-label='Our promises'] [data-running]")).toHaveCount(1);
  // The ticker moves.
  const track = page.locator("section[aria-label='Our promises'] [data-running]");
  const x1 = await track.evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).m41);
  await page.waitForTimeout(400);
  const x2 = await track.evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).m41);
  expect(x2).not.toBe(x1);
});

test("a wrong discount code shakes the field and shows the error", async ({ page }) => {
  await page.goto("/products/digital-thermometer");
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Add to cart", exact: true }).click();
  const drawer = page.getByRole("dialog", { name: /Your cart/ });
  await drawer.getByRole("link", { name: "View full cart" }).click();
  await page.getByLabel("Discount code").fill("NOPE123");
  await page.getByRole("button", { name: "Apply", exact: true }).click();
  await expect(page.locator("#coupon-error")).toBeVisible();
  // The shake moves the row without re-creating it, so what was typed stays.
  await expect(page.getByLabel("Discount code")).toHaveValue("NOPE123");
});
