import { expect, test } from "@playwright/test";

test("landing page loads", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });

  await page.goto("/");

  await expect(page).toHaveTitle("Tempora");
  await expect(page.getByText("Tempora")).toBeVisible();
  expect(consoleErrors).toEqual([]);
});
