import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

// Use the authenticated state
test.use({ storageState: "tests/.auth/user.json" });

test.describe("Healthcare Services Management - Delete", () => {
  let facilityId: string;

  test.beforeEach(async ({ page }) => {
    // Navigate to healthcare services
    facilityId = getFacilityId();
    await page.goto(`/facility/${facilityId}/settings/healthcare_services`);
  });

  test("Delete an existing healthcare service", async ({ page }) => {
    const serviceName = faker.commerce.productName();
    await page.getByRole("button", { name: "Add Healthcare Service" }).click();
    await page.getByRole("textbox", { name: "Name" }).fill(serviceName);
    await page
      .getByRole("combobox")
      .filter({ hasText: "Select locations" })
      .click();
    const plusButton = page.locator("button:has(svg.lucide-plus)").first();
    await expect(plusButton).toBeVisible({ timeout: 5000 });
    await plusButton.click();
    await page.getByRole("button", { name: "Create" }).click();

    // Click Delete button
    const serviceLink = page.getByRole("link", {
      name: new RegExp(serviceName, "i"),
    });
    await serviceLink.click();

    await page.getByRole("button", { name: "Delete" }).click();

    // Confirm deletion
    await page.getByRole("button", { name: "Confirm" }).click();

    // Verify success toast or message
    await expect(
      page.getByText("Healthcare service deleted successfully"),
    ).toBeVisible({ timeout: 10000 });

    const deletedServiceLink = page.getByRole("link", {
      name: new RegExp(serviceName, "i"),
    });
    await expect(deletedServiceLink).toHaveCount(0);
  });
});
