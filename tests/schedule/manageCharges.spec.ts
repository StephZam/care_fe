import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Manage Charges", () => {
  let facilityId: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    await page.goto(`/facility/${facilityId}/users/admin/availability`);
  });

  test("should update manage charges and disable revisit charge when days set to 0", async ({
    page,
  }) => {
    const templateName = faker.commerce.productName();
    const sessionName = faker.commerce.productName();
    await page.getByRole("button", { name: "Create Template" }).click();
    const template = page.getByRole("textbox", { name: "Template Name *" });
    await template.click();
    await template.fill(templateName);

    await page.getByRole("button", { name: "Pick a date" }).first().click();

    // Wait for date picker dialog to appear
    const dateDialog = page.getByRole("dialog").filter({
      hasText:
        "JanFebMarAprMayJunJulAugSepOctNovDecNov19251926192719281929193019311932193319341",
    });
    await expect(dateDialog).toBeVisible({ timeout: 5000 });

    // Get all enabled date buttons inside the dialog
    const dateButtons = dateDialog.locator(
      'button[aria-label*=","]:not([disabled])',
    );
    const count = await dateButtons.count();
    if (count < 2)
      throw new Error("Not enough selectable dates in date picker");

    // Click the first available date (start date)
    await dateButtons.nth(1).click();

    // === PICK END DATE ===
    await page.getByRole("button", { name: "Pick a date" }).click();

    // Wait for the date picker dialog again
    const dateDialog2 = page.getByRole("dialog").filter({
      hasText:
        "JanFebMarAprMayJunJulAugSepOctNovDecNov19251926192719281929193019311932193319341",
    });
    await expect(dateDialog2).toBeVisible({ timeout: 5000 });

    // Click a date *after* the start date (e.g., 2nd or 3rd date)
    const endDateButtons = dateDialog2.locator(
      'button[aria-label*=","]:not([disabled])',
    );
    const endCount = await endDateButtons.count();
    if (endCount < 2) throw new Error("Not enough selectable end dates");

    await endDateButtons.nth(5).click(); // Choose the next date after start

    await page
      .getByRole("button")
      .filter({ hasText: /Mon|Tue|Wed|Thu|Fri|Sat|Sun/i })
      .first()
      .click();
    const session = page.getByRole("textbox", { name: "Session Title *" });
    await session.click();
    await session.fill(sessionName);
    await page.getByRole("textbox", { name: "Start Time *" }).fill("11:50");
    await page.getByRole("textbox", { name: "End Time *" }).click();
    await page.getByRole("textbox", { name: "End Time *" }).fill("17:50");
    await page
      .getByRole("spinbutton", { name: "Slot duration (mins.) *" })
      .click();
    await page
      .getByRole("spinbutton", { name: "Slot duration (mins.) *" })
      .fill("30");
    await page.getByRole("spinbutton", { name: "Patients per Slot *" }).click();
    await page
      .getByRole("spinbutton", { name: "Patients per Slot *" })
      .fill("3");
    await page.getByRole("button", { name: "Save" }).click();
    await page.getByRole("button", { name: "Manage Charges" }).first().click();

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
