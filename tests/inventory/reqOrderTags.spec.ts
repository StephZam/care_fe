import { expect, Page, test } from "@playwright/test";

// Use authenticated session
test.use({ storageState: "tests/.auth/user.json" });

test.describe.serial("Request Order Tag Management", () => {
  /**
   * Navigates from home to the Outgoing Orders page
   */
  async function navigateToOutgoingOrders(page: Page) {
    await page.goto("/");

    // Facility card → toggle sidebar → services → inventory → outgoing orders
    await page.locator('[data-slot="card"]').first().click();
    await page.getByRole("button", { name: /toggle sidebar/i }).click();
    await page.getByRole("link", { name: /^services$/i }).click();

    // Open the first service
    await page.locator('[data-slot="card"]').first().click();
    await page.locator('[data-slot="card"]').first().click();

    // Go to Inventory → Outgoing Orders
    await page.getByRole("button", { name: /inventory/i }).click();
    await page.getByRole("link", { name: /outgoing orders/i }).click();

    // Wait until Outgoing Orders heading appears
    await expect(page.getByRole("heading", { name: /orders/i })).toBeVisible({
      timeout: 10000,
    });
  }

  /**
   * Selects or deselects tags inside the "Add Tags" dialog
   */
  async function toggleTags(page: Page, tags: string[], select = true) {
    for (const tag of tags) {
      // Locate the tag’s container
      const tagRow = page.locator(`div:has-text("${tag}")`).first();

      // Locate the checkbox within that specific tag row
      const checkbox = tagRow.locator('button[role="checkbox"]').first();

      // Wait until it's visible
      await expect(checkbox).toBeVisible({ timeout: 5000 });

      // Determine if it needs to be toggled
      const isChecked = await checkbox.getAttribute("aria-checked");
      const shouldClick =
        (select && isChecked === "false") || (!select && isChecked === "true");

      if (shouldClick) {
        await checkbox.click();
        await page.waitForTimeout(200);
      }
    }
  }

  /**
   * Creates an order with one or more tags
   */
  async function createOrderWithTags(
    page: Page,
    orderName: string,
    tags: string[],
  ) {
    await page.getByRole("button", { name: /create order/i }).click();

    // Fill basic order details
    await page.getByRole("textbox", { name: /name/i }).fill(orderName);

    await page
      .getByRole("combobox")
      .filter({ hasText: "Select Location" })
      .click();
    await page.getByRole("option").first().click();

    // Open Tag Selector
    const addTagsButton = page.getByRole("button", { name: /add tags/i });
    await expect(addTagsButton).toBeVisible();
    await addTagsButton.click();

    // Select desired tags
    await toggleTags(page, tags, true);

    // Close the tag dialog (Escape closes dropdown)
    await page.locator("html").click();

    // Submit order
    await page.getByRole("button", { name: /create/i }).click();

    await expect(page.locator("ol")).toContainText(
      "Order created successfully",
    );

    // Verify success label and tag presence
    await expect(page.locator("label", { hasText: "Tags" })).toBeVisible({
      timeout: 10000,
    });

    for (const tag of tags) {
      await expect(page.locator("#pages")).toContainText(tag);
    }
  }

  // --- 🧩 TESTS START HERE ---

  test.beforeEach(async ({ page }) => {
    await navigateToOutgoingOrders(page);
  });

  test("should create an order with selected tags and verify details", async ({
    page,
  }) => {
    await createOrderWithTags(page, "AutoOrder1", ["tag 1"]);
  });

  test("should add a new tag successfully", async ({ page }) => {
    const addTagsBtn = page
      .getByRole("button", { name: /add tags|tags/i })
      .first();
    await expect(addTagsBtn).toBeVisible({ timeout: 10000 });
    await addTagsBtn.click();

    const checkboxes = page.getByRole("checkbox");
    const total = await checkboxes.count();
    expect(total).toBeGreaterThan(0);

    // Select first unchecked tag
    for (let i = 0; i < total; i++) {
      const checkbox = checkboxes.nth(i);
      if (!(await checkbox.isChecked())) {
        await checkbox.click();
        break;
      }
    }

    // Confirm success toast
    await expect(page.locator("ol")).toContainText("Tags updated successfully");
  });

  test("should remove an existing tag successfully", async ({ page }) => {
    const tagsBtn = page
      .getByRole("button", { name: /add tags|tags/i })
      .first();
    await expect(tagsBtn).toBeVisible({ timeout: 10000 });
    await tagsBtn.click();

    const checkboxes = page.getByRole("checkbox");
    const total = await checkboxes.count();
    expect(total).toBeGreaterThan(0);

    // Deselect one checked tag
    let tagRemoved = false;
    for (let i = 0; i < total; i++) {
      const checkbox = checkboxes.nth(i);
      if (await checkbox.isChecked()) {
        await checkbox.click();
        tagRemoved = true;
        break;
      }
    }

    // Verify result
    if (tagRemoved) {
      await expect(page.locator("ol")).toContainText(
        "Tags updated successfully",
      );
    } else {
      test.info().annotations.push({
        type: "info",
        description: "No tags were checked to remove.",
      });
    }
  });
});
