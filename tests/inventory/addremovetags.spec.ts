import { expect, test } from "@playwright/test";

// Use authenticated session
test.use({ storageState: "tests/.auth/user.json" });

test.describe("Request Order Tag Management", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");

    // Navigate to Facility with Patients → Services → Outgoing Orders
    await page.locator('[data-slot="card-content"]').first().click();
    await page.getByRole("button", { name: /toggle sidebar/i }).click();
    await page.getByRole("link", { name: /^services$/i }).click();

    // View first service details
    await page
      .getByRole("button", { name: /view details/i })
      .first()
      .click();

    // Go to Inventory → Outgoing Orders
    await page.getByRole("button", { name: /view requests/i }).click();
    await page.getByRole("button", { name: /inventory/i }).click();
    await page.getByRole("link", { name: /outgoing orders/i }).click();
  });

  // --- ADD TAG TEST ---
  test("should add a tag successfully", async ({ page }) => {
    // Open the Add Tags dialog (works for 'Add Tags' or 'Tags' button)
    await page
      .getByRole("button", { name: /add tags|tags/i })
      .first()
      .click();

    const checkboxes = page.getByRole("checkbox");

    const count = await checkboxes.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const checkbox = checkboxes.nth(i);

      // Only click if checkbox is NOT already checked
      const isChecked = await checkbox.isChecked();
      if (!isChecked) {
        await checkbox.click();
        break;
      }
    }

    // Expect success toast
    const toast = page.locator("ol");
    await expect(toast).toContainText("Tags updated successfully");
  });

  // --- REMOVE TAG TEST ---
  test("should remove a tag successfully", async ({ page }) => {
    // Open the existing tags menu
    await page
      .getByRole("button", { name: /add tags|tags/i })
      .first()
      .click();

    const checkboxes = page.getByRole("checkbox");

    const count = await checkboxes.count();
    expect(count).toBeGreaterThan(0);

    let removed = false;

    for (let i = 0; i < count; i++) {
      const checkbox = checkboxes.nth(i);
      if (await checkbox.isChecked()) {
        // Click only a checked checkbox to remove the tag
        await checkbox.click();
        removed = true;
        break;
      }
    }

    // Expect success toast only if a tag was removed
    if (removed) {
      const toast = page.locator("ol");
      await expect(toast).toContainText("Tags updated successfully");
    }
  });
});
