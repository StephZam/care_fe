import { expect, Page, test } from "@playwright/test";

// Use authenticated session
test.use({ storageState: "tests/.auth/user.json" });

test.describe("Request Order Tag Management", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");

    // Navigate to Facility with Patients → Services → Outgoing Orders
    await page.locator('[data-slot="card"]').first().click();
    await page.getByRole("button", { name: /toggle sidebar/i }).click();
    await page.getByRole("link", { name: /^services$/i }).click();

    // View first service details
    await page.locator('[data-slot="card"]').first().click();

    // Go to Inventory → Outgoing Orders
    await page.locator('[data-slot="card"]').first().click();
    await page.getByRole("button", { name: /inventory/i }).click();
    await page.getByRole("link", { name: /outgoing orders/i }).click();
  });

  async function createOrderWithTags(
    page: Page,
    orderName: string,
    tagsToSelect: string[],
  ) {
    // Click "Create Order" button
    await page.getByRole("button", { name: /create order/i }).click();

    // Fill order details
    await page.getByRole("textbox", { name: /name/i }).fill(orderName);
    await page
      .getByRole("combobox")
      .filter({ hasText: "Select Location" })
      .click();
    await page.getByRole("option").first().click();

    // Open tag selector
    await page.getByRole("button", { name: /add tags/i }).click();

    // Click the tags specified

    for (const tag of tagsToSelect) {
      // Find the container element containing the tag text
      const tagRow = page.locator("div", { hasText: tag });

      // Locate its checkbox inside that row
      const checkbox = tagRow.locator('button[role="checkbox"]').first();

      // Only click if unchecked
      const checked = await checkbox.getAttribute("aria-checked");
      if (checked === "false") {
        await checkbox.click();
        await page.waitForTimeout(200); // allow UI update
      }
    }

    await page.locator("html").click(); // close dropdown

    // Create the order
    await page.getByRole("button", { name: /create/i }).click();

    // Verify order appears in table
    const tagsRow = page.locator("label").filter({ hasText: "Tags" });
    await expect(tagsRow).toBeVisible();

    // Verify tags appear in details
    for (const tag of tagsToSelect) {
      await expect(page.locator("#pages")).toContainText(tag);
    }
  }

  // Example test using generic function
  test("should create an order with any tags and see them in details", async ({
    page,
  }) => {
    await createOrderWithTags(page, "order11", ["tag 1"]);
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
