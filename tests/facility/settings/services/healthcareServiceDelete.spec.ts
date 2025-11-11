import { expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

// Use the authenticated state
test.use({ storageState: "tests/.auth/user.json" });

test.describe("Healthcare Services Management - Delete", () => {
  let facilityId: string;
  test.beforeEach(async ({ page }) => {
    // Navigate to profile page
    facilityId = getFacilityId();
    await page.goto(`/facility/${facilityId}/overview`);
    await page.getByRole("button", { name: /toggle sidebar/i }).click();
    await page.getByRole("button", { name: "Settings" }).click();
    await page.getByRole("link", { name: "Healthcare Services" }).click();
  });

  test("Delete an existing healthcare service", async ({ page }) => {
    // Ensure the service exists before deletion
    const serviceLinks = page
      .getByRole("link")
      .filter({ hasText: /View Details/i });

    await expect(serviceLinks.first())
      .toBeVisible({ timeout: 5000 })
      .catch(() => {});
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
