import { expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Back button should not appear when page is opened in a new tab without history", () => {
  let facilityId: string;

  test.beforeEach(async () => {
    facilityId = getFacilityId();
  });

  test("Back Button in Products", async ({ page, context }) => {
    // Navigate to product page to get a product URL
    await page.goto(`/facility/${facilityId}/settings/product`);

    // Click on a product to view it
    await page.getByRole("link", { name: "View" }).first().click();

    // Get the current product view URL
    const productViewUrl = page.url();

    // Open the same product view page directly in a new tab (no navigation history)
    const newPage = await context.newPage();
    await newPage.goto(productViewUrl);

    // Verify back button does NOT appear (no history)
    const backButton = newPage.getByRole("link", { name: /back to list/i });
    const count = await backButton.count();
    expect(count).toBe(0);
  });

  test("Back button in Healthcare Services", async ({ page, context }) => {
    // Navigate to healthcare services page
    await page.goto(`/facility/${facilityId}/settings/healthcare_services`);

    // Click on the first "View Details" link inside card-content
    await page.locator('[data-slot="card-content"]').first().click();

    // Get the current view URL
    const serviceViewUrl = page.url();

    // Open the same page directly in a new tab (no navigation history)
    const newPage = await context.newPage();
    await newPage.goto(serviceViewUrl);

    // Verify back button does NOT appear (no history)
    const backButton = newPage.getByRole("link", { name: "Back to List" });
    const count = await backButton.count();
    expect(count).toBe(0);
  });
});
