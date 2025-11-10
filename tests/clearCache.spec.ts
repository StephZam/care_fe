import { expect, test } from "@playwright/test";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Clear Cache in profile successfully", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to profile page
    await page.goto("/");
    const firstFacilityLink = page
      .getByRole("link")
      .filter({ hasText: "View" })
      .first();
    await expect(firstFacilityLink).toBeVisible({ timeout: 10000 });
    await firstFacilityLink.click();
    await page.getByRole("button", { name: /toggle sidebar/i }).click();
    await page.locator('div[data-sidebar="footer"] button').first().click();
    await page.getByRole("menuitem", { name: "Profile" }).click();

    await expect(
      page.getByRole("button", { name: /clear cache/i }),
    ).toBeVisible();
  });

  test("should clear real caches and unregister service workers", async ({
    page,
  }) => {
    // Create a dummy cache
    await page.evaluate(async () => {
      const cache = await caches.open("test-cache");
      await cache.put("/dummy", new Response("dummy data"));
    });

    // Register a dummy service worker
    await page.evaluate(async () => {
      try {
        await navigator.serviceWorker.register("/dummy-sw.js", { scope: "/" });
      } catch (e) {
        console.error("SW registration failed:", e);
      }
    });

    // Ensure cache & SW exist before clearing
    const preCaches = await page.evaluate(() => caches.keys());
    expect(preCaches.includes("test-cache")).toBe(true);

    const preRegs = await page.evaluate(
      async () => (await navigator.serviceWorker.getRegistrations()).length,
    );
    expect(preRegs).toBeGreaterThan(0);

    // Click Clear Cache button
    await page.getByRole("button", { name: /clear cache/i }).click();

    await page.waitForLoadState("load"); // Wait for reload to complete
    await page.waitForFunction(async () => {
      const keys = await caches.keys();
      return !keys.includes("test-cache");
    });

    // Verify cache has been deleted
    const remainingCaches = await page.evaluate(() => caches.keys());
    expect(remainingCaches.includes("test-cache")).toBe(false);

    // Verify service worker has been unregistered
    const remainingRegs = await page.evaluate(
      async () => (await navigator.serviceWorker.getRegistrations()).length,
    );
    expect(remainingRegs).toBeLessThan(preRegs);
  });
});
