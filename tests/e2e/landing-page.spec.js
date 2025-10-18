import { test, expect } from "./fixtures";

test.describe("Landing Page", () => {
  test("should load the homepage", async ({ page }) => {
    await page.goto("/");

    // Check that the page loaded
    await expect(page).toHaveTitle(/Horizon/i);
  });

  test("should display sign in button", async ({ page }) => {
    await page.goto("/");

    // Look for sign in button
    const signInButton = page.getByRole("button", { name: /sign in/i });
    await expect(signInButton).toBeVisible();
  });

  test("should have navigation elements", async ({ page }) => {
    await page.goto("/");

    // Check for main navigation or header
    await expect(page.locator("header, nav, .navbar")).toBeVisible();
  });
});
