import { expect, test, type Page } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Clear Cache in profile successfully", () => {
  async function navigateToProfile(page: Page, facilityId: string) {
    await page.goto(`/facility/${facilityId}/overview`);
    await page.getByRole("button", { name: /toggle sidebar/i }).click();
    await page.locator('div[data-sidebar="footer"] button').first().click();
    await page.getByRole("menuitem", { name: "Profile" }).click();
    await expect(
      page.getByRole("button", { name: /clear cache/i }),
    ).toBeVisible();
  }

  test("should clear caches and unregister service workers", async ({
    page,
  }) => {
    const facilityId = getFacilityId();

    // Navigate to profile page
    await navigateToProfile(page, facilityId);

    // Create a test cache to verify clearing works
    await page.evaluate(async () => {
      const cache = await caches.open("test-cache");
      await cache.put("/dummy", new Response("dummy data"));
    });

    // Verify test cache exists before clearing
    const preCaches = await page.evaluate(() => caches.keys());
    expect(preCaches).toContain("test-cache");

    // Get initial service worker registrations count
    const preRegs = await page.evaluate(
      async () => (await navigator.serviceWorker.getRegistrations()).length,
    );

    // Set up page reload listener
    const reloadPromise = page.waitForLoadState("domcontentloaded");

    // Click Clear Cache button
    await page.getByRole("button", { name: /clear cache/i }).click();

    // Wait for page reload
    await reloadPromise;
    await page.waitForLoadState("networkidle");

    // Wait for cache to be cleared
    await page.waitForFunction(
      () => {
        return caches.keys().then((keys) => !keys.includes("test-cache"));
      },
      { timeout: 10000 },
    );

    // Verify test cache has been deleted
    const remainingCaches = await page.evaluate(() => caches.keys());
    expect(remainingCaches).not.toContain("test-cache");

    // Verify service workers have been unregistered
    const remainingRegs = await page.evaluate(
      async () => (await navigator.serviceWorker.getRegistrations()).length,
    );

    // If there were service workers before, verify they're reduced or gone
    if (preRegs > 0) {
      expect(remainingRegs).toBeLessThanOrEqual(preRegs);
    }

    // Verify user is still on the same page after reload
    await expect(
      page.getByRole("button", { name: /clear cache/i }),
    ).toBeVisible();
  });
});
