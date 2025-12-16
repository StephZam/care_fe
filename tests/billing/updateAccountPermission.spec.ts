import { expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

test.describe("Account Management Permissions", () => {
  let facilityId: string;

  test.beforeEach(async ({ page }) => {
    // Navigate to healthcare services
    facilityId = getFacilityId();
    await page.goto(`/facility/${facilityId}/billing/accounts`);
  });

  test.describe("facility admin", () => {
    test.use({ storageState: "tests/.auth/facilityAdmin.json" });

    test("can edit and rebalance accounts", async ({ page }) => {
      // Verify Edit button is visible on accounts list
      const editButton = page.getByRole("button", { name: "Edit" }).first();
      await expect(editButton).toBeVisible();

      // Navigate to account detail page
      await page.getByRole("button", { name: "Go to account" }).first().click();

      // Verify Edit button is visible on account details
      const accountEditButton = page.getByRole("button", { name: "Edit E" });
      await expect(accountEditButton).toBeVisible();

      // Verify Rebalance button is visible
      const rebalanceButton = page.getByRole("button", { name: "Rebalance" });
      await expect(rebalanceButton).toBeVisible();
    });
  });

  test.describe("admin", () => {
    test.use({ storageState: "tests/.auth/user.json" });

    test("can edit and rebalance accounts", async ({ page }) => {
      // Verify Edit button is visible on accounts list
      const editButton = page.getByRole("button", { name: "Edit" }).first();
      await expect(editButton).toBeVisible();

      // Navigate to account detail page
      await page.getByRole("button", { name: "Go to account" }).first().click();

      // Verify Edit button is visible on account details
      const accountEditButton = page.getByRole("button", { name: "Edit E" });
      await expect(accountEditButton).toBeVisible();

      // Verify Rebalance button is visible
      const rebalanceButton = page.getByRole("button", { name: "Rebalance" });
      await expect(rebalanceButton).toBeVisible();
    });
  });

  test.describe("nurse", () => {
    test.use({ storageState: "tests/.auth/nurse.json" });

    test("cannot edit or rebalance accounts", async ({ page }) => {
      // Verify Edit button is not visible on accounts list
      const editButton = page.getByRole("button", { name: "Edit" }).first();
      await expect(editButton).not.toBeVisible();

      // Navigate to account detail page
      await page.getByRole("button", { name: "Go to account" }).first().click();

      // Verify Edit button is not visible on account details
      const accountEditButton = page.getByRole("button", { name: "Edit E" });
      await expect(accountEditButton).not.toBeVisible();

      // Verify Rebalance button is not visible
      const rebalanceButton = page.getByRole("button", { name: "Rebalance" });
      await expect(rebalanceButton).not.toBeVisible();
    });
  });
});
