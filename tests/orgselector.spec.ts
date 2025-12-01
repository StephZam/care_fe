import { expect, test } from "@playwright/test";
import { format, subDays } from "date-fns";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Organization Selector Management", () => {
  test.beforeEach(async ({ page }) => {
    const facilityId = getFacilityId();
    const createdDateAfter = format(subDays(new Date(), 90), "yyyy-MM-dd");
    const createdDateBefore = format(new Date(), "yyyy-MM-dd");

    // Navigate to encounters page with date filters
    await page.goto(
      `/facility/${facilityId}/encounters/patients/all?created_date_after=${createdDateAfter}&created_date_before=${createdDateBefore}`,
    );

    // Navigate to patient home
    await page.getByRole("link", { name: "Patient Home" }).first().click();

    // Create a new encounter
    await page
      .getByRole("button", { name: "Create Encounter" })
      .first()
      .click();

    await page
      .getByRole("button", { name: "Inpatient Patient is admitted" })
      .click();
    await page
      .getByRole("combobox")
      .filter({ hasText: "Select Department" })
      .click();
    await page.getByRole("option").first().click();
    await page
      .getByRole("button", { name: "Create Encounter ⇧ + ENTER" })
      .click();
  });

  test("add and remove organization in encounter", async ({ page }) => {
    // Click on Details tab and wait for content to load
    await page.getByRole("tab", { name: "Details" }).click();

    // Click the manage departments button within the Details tab panel
    await page.getByTestId("manage-departments-button").last().click();
    await page.getByRole("button").filter({ hasText: /^$/ }).click();
    await page.getByRole("button").click();

    await page.getByRole("button").click();
    await expect(page.locator("ol")).toContainText(
      "Organization removed successfully",
    );

    await page.getByRole("combobox").click();
    await page.getByRole("option").first().click();
    await page.getByRole("button", { name: "Save Changes" }).click();
    await expect(page.locator("ol")).toContainText(
      "Organization added successfully",
    );
  });
});
