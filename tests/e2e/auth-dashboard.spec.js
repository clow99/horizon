import { test, expect } from "./fixtures";

test("authenticated dashboard renders quick actions and user menu", async ({
  page,
  loginAsTestUser,
  captureCheckpoint,
  testUser,
}) => {
  await loginAsTestUser();
  await page.goto("/dashboard");

  await captureCheckpoint("dashboard-loaded");

  await expect(
    page.getByRole("heading", { name: /quick actions/i })
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /new project/i })
  ).toBeVisible();
  await expect(page.getByText(testUser.name)).toBeVisible();
  await expect(page.getByRole("link", { name: /table view/i })).toBeVisible();
});
