import { expect, test } from "@playwright/test";

// Use authenticated session
test.use({ storageState: "tests/.auth/user.json" });

test.describe("Organization Selector Management", () => {
  test.beforeEach(async ({ page }) => {
    // Go to the app
    await page.goto("/");
    // Navigate to Facility with Patients → Encounters
    await page.locator('[data-slot="card-content"]').first().click();

    await page
      .getByRole("link", { name: "Encounters Manage encounters" })
      .click();
    const dateFilter = page.locator("div").filter({ hasText: /^Date$/ });
    await dateFilter.click();
    await dateFilter.scrollIntoViewIfNeeded();
    await page.getByRole("button", { name: "Last year" }).click();
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "View Encounter" }).nth(7).click();
    const editBt = page.locator(
      '[id="radix-«r2p»-content-details"] > div > .hidden.xl\\:flex > div:nth-child(7) > .flex.justify-between > .inline-flex',
    );

    // Find the scroll area that contains the edit button
    await editBt.scrollIntoViewIfNeeded();

    await editBt.click();
  });

  // --- ADD ORGANIZATION TEST ---
  test("should add an organization successfully", async ({ page }) => {
    // Open the organization selector
    await page
      .getByRole("tab", { name: /all organizations|my organizations/i })
      .first()
      .click();

    // Select an organization from the dropdown
    await page.getByRole("combobox").click();
    const options = page.getByRole("option");
    const count = await options.count();

    const currentOrgsSection = page.locator("section, div").filter({
      has: page.getByRole("heading", { name: "Current Organizations" }),
    });

    let selected = false;

    for (let i = 0; i < count; i++) {
      const option = options.nth(i);
      const optionName = (await option.textContent())?.trim();

      // Skip empty or invalid options
      if (!optionName) continue;

      // Check if this org is already listed in current organizations
      const alreadyInList = await currentOrgsSection
        .getByText(optionName, { exact: true })
        .isVisible()
        .catch(() => false);

      if (!alreadyInList) {
        await option.click();
        selected = true;
        break;
      }
    }

    if (selected) {
      // Save changes
      await page.getByRole("button", { name: /save changes/i }).click();

      // Verify success toast
      const toast = page.locator("ol");
      await expect(toast).toContainText("Organization added successfully");
    }
  });

  // --- REMOVE ORGANIZATION TEST ---
  test("should remove an organization successfully", async ({ page }) => {
    // Open the organization selector
    await page
      .getByRole("tab", { name: /all organizations|my organizations/i })
      .first()
      .click();

    const currentOrgsSection = page.locator("section, div").filter({
      has: page.getByRole("heading", { name: "Current Organizations" }),
    });

    const remove = currentOrgsSection.locator('button[role="button"]').first();
    if ((await remove.count()) > 0 && (await remove.isVisible())) {
      await remove.click();
      await page.getByRole("button").click();

      // Remove the first selected organization
      const toast = page.locator("ol");
      await expect(toast).toContainText("Organization removed successfully");
    }
  });
});
