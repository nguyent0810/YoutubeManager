import { describe, expect, it } from "vitest"
import {
  extractJsonPayload,
  parseBulkMetadataResponse,
  parseReplyAssistResponse,
} from "./gemini"

describe("extractJsonPayload", () => {
  it("returns inner JSON from fenced block", () => {
    const raw = '```json\n{"suggestions":[]}\n```'
    expect(extractJsonPayload(raw)).toBe('{"suggestions":[]}')
  })

  it("extracts first object from surrounding text", () => {
    const raw = 'Here:\n{"suggestions":[]}\nDone'
    expect(extractJsonPayload(raw)).toBe('{"suggestions":[]}')
  })
})

describe("parseBulkMetadataResponse", () => {
  it("parses valid suggestions", () => {
    const text = JSON.stringify({
      suggestions: [
        {
          id: "a",
          title: "T".repeat(10),
          description: "Hello",
          tags: "x, y",
        },
      ],
    })
    const out = parseBulkMetadataResponse(text)
    expect(out.suggestions).toHaveLength(1)
    expect(out.suggestions[0]!.id).toBe("a")
  })

  it("rejects invalid JSON", () => {
    expect(() => parseBulkMetadataResponse("not json")).toThrow()
  })
})

describe("parseReplyAssistResponse", () => {
  it("parses reply object", () => {
    const out = parseReplyAssistResponse('{"text":"Thanks for watching!"}')
    expect(out.text).toBe("Thanks for watching!")
  })
})
