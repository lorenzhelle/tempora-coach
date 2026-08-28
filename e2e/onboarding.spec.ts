import { expect, test } from "@playwright/test";

test("onboarding redirects signed-out visitors to login", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });

  await page.goto("/onboarding");

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  expect(consoleErrors).toEqual([]);
});
