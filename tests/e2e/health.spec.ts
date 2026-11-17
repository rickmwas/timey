import { expect, test } from "@playwright/test";

test("renders the Timy shell and reports database readiness", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "A clearer view of every class." }),
  ).toBeVisible();

  const healthResponse = await page.request.get("/api/health");
  expect(healthResponse.status()).toBe(200);
  await expect(healthResponse).toBeOK();
  expect(await healthResponse.json()).toMatchObject({
    success: true,
    data: { status: "ok", database: "ready" },
  });
});