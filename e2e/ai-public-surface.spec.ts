import { test, expect } from "@playwright/test"

/**
 * AI-assisted UI lives behind auth and ai-status. Public routes must not expose
 * the bulk Gemini panel (regression guard without a signed-in fixture).
 */
test.describe("AI UI not on public pages", () => {
  test("landing page has no bulk AI metadata card", async ({ page }) => {
    await page.goto("/")
    await expect(page.getByText("AI metadata suggestions")).toHaveCount(0)
  })

  test("login page has no bulk AI metadata card", async ({ page }) => {
    await page.goto("/login")
    await expect(page.getByText("AI metadata suggestions")).toHaveCount(0)
  })
})
