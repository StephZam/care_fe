import { expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Manage Charges", () => {
  let facilityId: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    await page.goto(`/facility/${facilityId}/users/admin/availability`);
    await page.getByRole("button", { name: /Manage Charges/i }).click();
  });

  test("should update manage charges and disable revisit charge when days set to 0", async ({
    page,
  }) => {
    // Select a category (first combobox)
    const categoryDropdown = page.getByRole("combobox").first();
    await categoryDropdown.click();
    await page.getByRole("option").first().click();
    await page.getByRole("option").first().click();
    // Fill Re-visit allowed days = 0
    const revisitInput = page.getByRole("spinbutton", {
      name: /Re-visit allowed days/i,
    });
    await revisitInput.fill("0");

    // Expect the charge item definition dropdown to be reset and disabled
    const chargeDefDropdown = page
      .getByRole("combobox")
      .filter({ hasText: "Select charge item definition" });

    // Verify text is reset (empty or placeholder only)
    const text = (await chargeDefDropdown.textContent())?.trim() || "";
    expect(
      text === "" || /select charge item definition/i.test(text),
    ).toBeTruthy();

    // Verify clicking does not open the dropdown
    await chargeDefDropdown.click({ force: true });
    const expanded = await chargeDefDropdown.getAttribute("aria-expanded");
    expect(expanded).toBe("false"); // stays closed even after click

    // Save the changes
    await page.getByRole("button", { name: /Save/i }).click();

    // Verify success toast message
    await expect(page.locator("ol")).toContainText(
      "Charge item definition updated successfully",
    );
  });
});
