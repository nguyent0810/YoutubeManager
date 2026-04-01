import { test, expect } from "@playwright/test"

test.describe("public pages", () => {
  test("landing page shows hero", async ({ page }) => {
    await page.goto("/")
    await expect(
      page.getByRole("heading", { name: /Your channel command center/i })
    ).toBeVisible()
  })

  test("login page shows Google CTA", async ({ page }) => {
    await page.goto("/login")
    await expect(
      page.getByRole("button", { name: /Continue with Google/i })
    ).toBeVisible()
  })
})
