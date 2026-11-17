import { expect, test, type Page } from "@playwright/test";

async function mockSignedOut(page: Page) {
  await page.route("**/api/v1/auth/me", (route) =>
    route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Unauthorized" },
      }),
    }),
  );
}

test("keeps the landing page visible while session restoration is pending", async ({
  page,
}) => {
  let requestStarted = false;
  let requestFinished = false;

  await page.route("**/api/v1/auth/me", async (route) => {
    requestStarted = true;
    await new Promise((resolve) => setTimeout(resolve, 1500));
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        success: false,
        error: { code: "UNAVAILABLE", message: "Session service unavailable" },
      }),
    });
    requestFinished = true;
  });

  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect.poll(() => requestStarted).toBe(true);
  await expect(
    page.getByRole("heading", { name: "A clearer view of every class." }),
  ).toBeVisible();
  expect(requestFinished).toBe(false);
});

test("connects visitors to the existing sign in and account access pages", async ({
  page,
}) => {
  await mockSignedOut(page);
  await page.goto("/");

  await page.getByRole("link", { name: "Sign In" }).first().click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(
    page.getByRole("heading", { name: "Sign in to your account" }),
  ).toBeVisible();

  await page.goto("/signup");
  await expect(
    page.getByRole("heading", { name: "Get started with Timy" }),
  ).toBeVisible();
  await expect(
    page.getByText(/Contact your department administrator/),
  ).toBeVisible();
  await expect(page.locator("form")).toHaveCount(0);
});

test("redirects signed out visitors from protected pages to sign in", async ({
  page,
}) => {
  await mockSignedOut(page);
  await page.goto("/timetable");

  await expect(page).toHaveURL(/\/login$/);
  await expect(
    page.getByRole("heading", { name: "Sign in to your account" }),
  ).toBeVisible();
});

test("supports the mobile menu and avoids horizontal overflow", async ({
  page,
}) => {
  await mockSignedOut(page);
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto("/");

  const menuButton = page.getByRole("button", {
    name: "Open navigation menu",
  });
  await menuButton.click();
  await expect(
    page.getByRole("button", { name: "Close navigation menu" }),
  ).toHaveAttribute("aria-expanded", "true");

  await page.keyboard.press("Escape");
  await expect(menuButton).toBeFocused();
  await expect(menuButton).toHaveAttribute("aria-expanded", "false");

  await menuButton.click();
  await page
    .getByRole("navigation", { name: "Mobile navigation" })
    .getByRole("link", { name: "Features" })
    .click();
  await expect(page).toHaveURL(/#features$/);
  await expect(page.locator("#features")).toBeFocused();

  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const dimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
  }

  const navigationLinkSize = await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "Overview" })
    .evaluate((link) => Number.parseFloat(getComputedStyle(link).fontSize));
  expect(navigationLinkSize).toBeGreaterThanOrEqual(16);
  await expect(
    page.getByRole("img", { name: "Timy, Kisii University" }),
  ).toBeVisible();
});

test("publishes local sharing metadata and public crawler routes", async ({
  page,
}) => {
  await mockSignedOut(page);
  await page.goto("/");
  await expect(page.getByText(/Photo by/i)).toHaveCount(0);
  await expect(page.getByText(/Image credits:/i)).toBeVisible();
  await expect(page.locator("main figure figcaption")).toHaveCount(0);

  const canonical = await page
    .locator('link[rel="canonical"]')
    .getAttribute("href");
  const socialImage = await page
    .locator('meta[property="og:image"]')
    .getAttribute("content");
  const socialWidth = await page
    .locator('meta[property="og:image:width"]')
    .getAttribute("content");
  const socialHeight = await page
    .locator('meta[property="og:image:height"]')
    .getAttribute("content");
  const structuredDataText = await page
    .locator('script[type="application/ld+json"]')
    .textContent();
  const structuredData = JSON.parse(structuredDataText ?? "{}");

  expect(new URL(canonical ?? "").pathname).toBe("/");
  expect(socialImage).toContain("/images/landing/timy-social-card.png");
  expect(socialWidth).toBe("1200");
  expect(socialHeight).toBe("630");
  expect(structuredData).toMatchObject({
    "@type": "SoftwareApplication",
    name: "Timy",
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web",
    url: canonical,
  });
  expect(Object.keys(structuredData).sort()).toEqual(
    [
      "@context",
      "@type",
      "applicationCategory",
      "description",
      "name",
      "operatingSystem",
      "url",
    ].sort(),
  );

  const socialResponse = await page.request.get(
    new URL("/images/landing/timy-social-card.png", page.url()).toString(),
  );
  expect(socialResponse.status()).toBe(200);
  expect(socialResponse.headers()["content-type"]).toContain("image/png");

  const robotsResponse = await page.request.get(
    new URL("/robots.txt", page.url()).toString(),
  );
  const robotsText = await robotsResponse.text();
  expect(robotsText).toContain("Disallow: /api");
  expect(robotsText).toContain("Disallow: /dashboard");

  const sitemapResponse = await page.request.get(
    new URL("/sitemap.xml", page.url()).toString(),
  );
  const sitemapText = await sitemapResponse.text();
  expect(sitemapText).toContain(`<loc>${canonical}</loc>`);
  expect(sitemapText).not.toContain("/login");
});

test("provides an accessible local fallback when an image fails", async ({
  page,
}) => {
  await mockSignedOut(page);
  await page.route("**/_next/image**", (route) => route.abort());
  await page.goto("/");

  await expect(
    page.locator(
      '[role="img"][aria-label="Aerial view of a university campus in Kenya"]',
    ),
  ).toBeVisible();
});
