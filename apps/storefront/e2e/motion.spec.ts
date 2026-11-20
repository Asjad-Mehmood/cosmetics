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
