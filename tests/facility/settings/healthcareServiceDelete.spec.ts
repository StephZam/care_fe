import { expect, test } from "@playwright/test";

// Use the authenticated state
test.use({ storageState: "tests/.auth/user.json" });

test.describe("Healthcare Services Management - Delete", () => {
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
    await page.getByRole("button", { name: "Settings" }).click();
    await page.getByRole("link", { name: "Healthcare Services" }).click();
  });

  test("Delete an existing healthcare service", async ({ page }) => {
    // Ensure the service exists before deletion
    const serviceLinks = page
      .getByRole("link")
      .filter({ hasText: /View Details/i });

    await page.waitForTimeout(1000);
    const serviceCount = await serviceLinks.count();

    if (serviceCount === 0) {
      test.skip();
      return;
    }
    // Click to open service details
    const serviceLink = serviceLinks.first();
    await serviceLink.click();
    // Click Delete button
    await page.getByRole("button", { name: "Delete" }).click();

    // Confirm deletion
    await page.getByRole("button", { name: "Confirm" }).click();

    // Verify success toast or message
    await expect(
      page.getByText("Healthcare service deleted successfully"),
    ).toBeVisible({ timeout: 10000 });
  });
});
