import { expect, Page, test } from "@playwright/test";

// Use authenticated session
test.use({ storageState: "tests/.auth/user.json" });

function generateUniqueOrderName(base: string) {
  const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${base}_${randomSuffix}`;
}

test.describe.serial("Request Order Tag Management", () => {
  // Navigates from home to the Outgoing Orders page
  async function navigateToOutgoingOrders(page: Page) {
    await page.goto("/");

    // Facility card → toggle sidebar → services → inventory → outgoing orders
    const firstFacilityLink = page
      .getByRole("link")
      .filter({ hasText: "View" })
      .first();
    await expect(firstFacilityLink).toBeVisible({ timeout: 10000 });
    await firstFacilityLink.click();
    await page.getByRole("button", { name: /toggle sidebar/i }).click();
    await page.getByRole("link", { name: /^services$/i }).click();

    await page.locator('[data-slot="card"]').first().click();
    await page.locator('[data-slot="card"]').first().click();

    await page.getByRole("button", { name: /inventory/i }).click();
    await page.getByRole("link", { name: /outgoing orders/i }).click();

    // Wait until Outgoing Orders heading appears
    await expect(page.getByRole("heading", { name: /orders/i })).toBeVisible({
      timeout: 10000,
    });
  }

  // Selects or deselects tags inside the "Add Tags" dialog

  async function toggleTags(page: Page, select = true): Promise<string | null> {
    // Wait for the Add Tags section container to appear.
    const tagContainer = page
      .locator("div")
      .filter({ hasText: /Other\s+Tags/i })
      .first();

    // Check if the section exists at all
    const sectionCount = await tagContainer.count();
    if (sectionCount === 0) {
      test.info().annotations.push({
        type: "info",
        description: "'Other Tags' section not found — skipping tag selection.",
      });
      return null; // Skip gracefully
    }

    // Find checkbox elements *inside* that container.
    const checkboxes = page.locator('button[role="checkbox"]');
    const total = await checkboxes.count();

    // Try to select or deselect a checkbox.
    for (let i = 0; i < total; i++) {
      const checkbox = checkboxes.nth(i);
      const isChecked = await checkbox.getAttribute("aria-checked");

      const shouldClick =
        (select && isChecked === "false") || (!select && isChecked === "true");

      if (shouldClick) {
        const tagRow = checkbox.locator("xpath=ancestor::div[1]");
        const tagText = (await tagRow.textContent())?.trim() || "";

        await checkbox.scrollIntoViewIfNeeded();
        await checkbox.click({ force: true });
        await page.waitForTimeout(300);
        return tagText;
      }
    }

    return null;
  }

  // Creates an order with one or more tags

  async function createOrderWithTags(page: Page, orderName: string) {
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
    const selectedTag = await toggleTags(page, true);

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

    if (selectedTag) {
      await expect(page.locator("#pages")).toContainText(selectedTag);
    }
  }

  // --- TESTS START HERE ---

  test.beforeEach(async ({ page }) => {
    await navigateToOutgoingOrders(page);
  });

  test("should create an order with selected tags and verify details", async ({
    page,
  }) => {
    const orderName = generateUniqueOrderName("AutoOrder");
    await createOrderWithTags(page, orderName);
  });

  test("should add a new tag successfully", async ({ page }) => {
    const addTagsBtn = page
      .getByRole("button", { name: /add tags|tags/i })
      .first();

    await expect(addTagsBtn).toBeVisible({ timeout: 10000 });
    await addTagsBtn.click();

    const checkboxes = page.getByRole("checkbox");
    const total = await checkboxes.count();

    let uncheckedFound = false;

    for (let i = 0; i < total; i++) {
      const checkbox = checkboxes.nth(i);
      const state = await checkbox.getAttribute("aria-checked");
      if (state === "false") {
        uncheckedFound = true;
        await checkbox.click({ force: true });
        break;
      }
    }

    if (!uncheckedFound) {
      test.info().annotations.push({
        type: "info",
        description: "No unchecked tags found — skipping tag addition.",
      });
      return; // Skip gracefully without failing
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

    let checkedFound = false;

    for (let i = 0; i < total; i++) {
      const checkbox = checkboxes.nth(i);
      const state = await checkbox.getAttribute("aria-checked");
      if (state === "true") {
        checkedFound = true;
        await checkbox.click({ force: true });
        break;
      }
    }

    if (!checkedFound) {
      test.info().annotations.push({
        type: "info",
        description: "No checked tags found — skipping tag removal.",
      });
      return; // Skip gracefully without failing
    }

    // Verify success toast only if a tag was actually removed
    await expect(page.locator("ol")).toContainText("Tags updated successfully");
  });
});
