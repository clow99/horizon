import { test, expect } from "./fixtures";

const PROJECT_NAME = "Release Readiness";
const CUSTOM_TASK = "Custom Smoke Validation";

test("project lifecycle covers creation, custom task, and status toggle", async ({
  page,
  loginAsTestUser,
  captureCheckpoint,
}) => {
  await loginAsTestUser();
  await page.goto("/dashboard");

  await page.getByRole("button", { name: /new project/i }).click();
  await page.getByRole("button", { name: /production deployment/i }).click();

  await page.getByLabel(/project name/i).fill(PROJECT_NAME);
  await page.getByRole("button", { name: /add task/i }).click();
  await page.getByPlaceholder(/configure cdn/i).fill(CUSTOM_TASK);
  await captureCheckpoint("custom-task-configured");
  await page
    .getByRole("button", { name: "Add Task", exact: true })
    .last()
    .click();

  await captureCheckpoint("modal-before-create");
  await page.getByRole("button", { name: /create project/i }).click();

  const projectCard = page
    .locator('[data-testid^="project-card-"]')
    .filter({ hasText: PROJECT_NAME });
  await expect(projectCard).toBeVisible();
  await captureCheckpoint("project-created");

  await projectCard.getByRole("heading", { name: PROJECT_NAME }).click();
  await expect(page.getByText(CUSTOM_TASK)).toBeVisible();

  await page.locator("select").first().selectOption("Completed");
  await captureCheckpoint("task-completed");

  await page.getByRole("button", { name: "Close" }).click();

  await expect(
    projectCard.getByTestId("project-progress-value")
  ).toContainText(/1 \/ \d+ tasks/i);
});
