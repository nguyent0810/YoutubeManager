import { describe, expect, it } from "vitest"
import { isAiFullyEnabled } from "./ai-policy"

describe("isAiFullyEnabled", () => {
  it("is true only when all gates pass", () => {
    expect(
      isAiFullyEnabled({
        configured: true,
        orgEnabled: true,
        userOptIn: true,
      })
    ).toBe(true)
    expect(
      isAiFullyEnabled({
        configured: false,
        orgEnabled: true,
        userOptIn: true,
      })
    ).toBe(false)
    expect(
      isAiFullyEnabled({
        configured: true,
        orgEnabled: false,
        userOptIn: true,
      })
    ).toBe(false)
    expect(
      isAiFullyEnabled({
        configured: true,
        orgEnabled: true,
        userOptIn: false,
      })
    ).toBe(false)
  })
})
