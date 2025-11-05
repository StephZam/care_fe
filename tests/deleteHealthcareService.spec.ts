import { expect, test } from "@playwright/test";

// List of accounts to test
const accounts = [
  { username: "admin", password: "admin" },
  { username: "facility_admin_2_0", password: "Coronasafe@123" },
  { username: "volunteer_2_0", password: "Coronasafe@123" },
  { username: "doctor_2_0", password: "Coronasafe@123" },
  { username: "staff_2_0", password: "Coronasafe@123" },
  { username: "nurse_2_0", password: "Coronasafe@123" },
];

const canDeleteRoles = ["admin", "facility_admin_2_0"];

for (const account of accounts) {
  test.describe(`${account.username} permissions`, () => {
    test(`${account.username} delete healthcare service if allowed`, async ({
      page,
    }) => {
      // Login
      await page.goto("/login");
      await page
        .getByRole("textbox", { name: /username/i })
        .fill(account.username);
      await page.getByLabel(/password/i).fill(account.password);
      await page.getByRole("button", { name: /login/i }).click();
      await page.waitForURL(/(?!.*login)/);
      await expect(
        page.getByRole("heading", { name: /^Hey .+/ }),
      ).toBeVisible();

      // Navigate to Healthcare Services
      await page.locator('[data-slot="card-content"]').first().click();
      await page.getByRole("button", { name: "Toggle Sidebar" }).click();

      await page.getByRole("button", { name: "Settings" }).click();
      await page.getByRole("link", { name: "Healthcare Services" }).click();

      await page.waitForSelector('[data-slot="card-content"]', {
        timeout: 10000,
      });

      // Open first healthcare service
      await page.locator('[data-slot="card-content"]').first().click();

      //  Check if Delete button exists
      const deleteButton = page.getByRole("button", { name: /delete/i });

      let canDelete = false;
      try {
        // Wait up to 3 seconds for the button to appear
        await deleteButton.waitFor({ state: "visible", timeout: 3000 });
        canDelete = true;
      } catch {
        // Button didn’t appear — no permission
        canDelete = false;
      }

      if (canDeleteRoles.includes(account.username)) {
        // Should have delete access
        expect(canDelete).toBeTruthy();

        await deleteButton.click({ force: true });
        await page.getByRole("button", { name: "Confirm" }).click();
        const toast = page.locator("ol");
        await expect(toast).toContainText(
          "Healthcare service deleted successfully",
        );
      } else {
        // Should NOT see delete button
        await expect(deleteButton).toHaveCount(0);
      }
    });
  });
}
