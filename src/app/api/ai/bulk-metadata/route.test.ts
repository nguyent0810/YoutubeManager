import { describe, expect, it, vi, beforeEach } from "vitest"

const hoisted = vi.hoisted(() => ({
  assertAiAllowed: vi.fn<[], Promise<Response | null>>(),
  requireOrgWrite: vi.fn<[], Promise<Response | { userId: string; organizationId: string }>>(),
  generateBulk: vi.fn(),
  writeAuditLog: vi.fn(),
}))

vi.mock("@/lib/api-response", () => ({
  jsonError: (message: string, status: number, code?: string) => {
    const body: { error: string; code?: string } = { error: message }
    if (code) body.code = code
    return new Response(JSON.stringify(body), { status })
  },
  httpStatusFromError: () => 500,
}))

vi.mock("@/lib/logger", () => ({
  logApiError: vi.fn(),
}))

vi.mock("@/lib/ai-guard", () => ({
  assertAiAllowed: hoisted.assertAiAllowed,
}))

vi.mock("@/lib/api-org-context", () => ({
  requireOrgWrite: hoisted.requireOrgWrite,
}))

vi.mock("@/lib/gemini", () => ({
  MAX_BULK_METADATA_ITEMS: 25,
  generateBulkMetadataSuggestions: hoisted.generateBulk,
}))

vi.mock("@/lib/audit-log", () => ({
  writeAuditLog: hoisted.writeAuditLog,
}))

import { POST } from "./route"

beforeEach(() => {
  vi.clearAllMocks()
  hoisted.requireOrgWrite.mockResolvedValue({
    userId: "user-1",
    organizationId: "org-1",
  })
  hoisted.assertAiAllowed.mockResolvedValue({ apiKey: "test-api-key" })
  hoisted.generateBulk.mockResolvedValue([
    { id: "row-1", title: "AI title", description: "AI description" },
  ])
  hoisted.writeAuditLog.mockResolvedValue(undefined)
})

describe("POST /api/ai/bulk-metadata", () => {
  it("returns ordered suggestions", async () => {
    const req = new Request("http://localhost/api/ai/bulk-metadata", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: [{ id: "row-1", basename: "clip.mp4" }],
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const json = (await res.json()) as { suggestions: { id: string }[] }
    expect(json.suggestions).toEqual([
      { id: "row-1", title: "AI title", description: "AI description" },
    ])
    expect(hoisted.writeAuditLog).toHaveBeenCalled()
  })

  it("returns 403 when AI guard blocks", async () => {
    hoisted.assertAiAllowed.mockResolvedValue(
      new Response(JSON.stringify({ error: "blocked", code: "ai_disabled" }), {
        status: 403,
      })
    )
    const req = new Request("http://localhost/api/ai/bulk-metadata", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: [{ id: "row-1", basename: "clip.mp4" }],
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(403)
  })

  it("returns 400 for empty items", async () => {
    const req = new Request("http://localhost/api/ai/bulk-metadata", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: [] }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})
