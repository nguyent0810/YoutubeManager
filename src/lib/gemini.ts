import { GoogleGenerativeAI } from "@google/generative-ai"
import { z } from "zod"

export const MAX_BULK_METADATA_ITEMS = 25
export const GEMINI_TIMEOUT_MS = 90_000

export const bulkMetadataSuggestionItemSchema = z.object({
  id: z.string().min(1).max(128),
  title: z.string().min(1).max(100),
  description: z.string().max(5000),
  tags: z.string().max(500).optional(),
})

export const bulkMetadataResponseSchema = z.object({
  suggestions: z.array(bulkMetadataSuggestionItemSchema).max(MAX_BULK_METADATA_ITEMS),
})

export const replyAssistResponseSchema = z.object({
  text: z.string().min(1).max(10_000),
})

export type BulkMetadataSuggestion = z.infer<typeof bulkMetadataSuggestionItemSchema>

/** Strip markdown code fences so zod JSON parse is reliable. */
export function extractJsonPayload(text: string): string {
  const t = text.trim()
  const m = /^```(?:json)?\s*([\s\S]*?)```$/m.exec(t)
  if (m?.[1]) return m[1].trim()
  const start = t.indexOf("{")
  const end = t.lastIndexOf("}")
  if (start >= 0 && end > start) return t.slice(start, end + 1)
  return t
}

export function parseBulkMetadataResponse(rawModelText: string) {
  const payload = extractJsonPayload(rawModelText)
  const parsed: unknown = JSON.parse(payload)
  return bulkMetadataResponseSchema.parse(parsed)
}

export function parseReplyAssistResponse(rawModelText: string) {
  const payload = extractJsonPayload(rawModelText)
  const parsed: unknown = JSON.parse(payload)
  return replyAssistResponseSchema.parse(parsed)
}

function getModelName(): string {
  return process.env.GEMINI_MODEL?.trim() || "gemini-2.0-flash"
}

function raceTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => {
      reject(new Error("Gemini request timed out."))
    }, ms)
    promise
      .then((v) => {
        clearTimeout(id)
        resolve(v)
      })
      .catch((e) => {
        clearTimeout(id)
        reject(e)
      })
  })
}

export async function generateBulkMetadataSuggestions(args: {
  apiKey: string
  items: Array<{ id: string; basename: string; title?: string }>
  context?: string
}): Promise<BulkMetadataSuggestion[]> {
  const key = args.apiKey.trim()
  if (!key) throw new Error("Gemini API key is missing")

  const genAI = new GoogleGenerativeAI(key)
  const model = genAI.getGenerativeModel({ model: getModelName() })

  const lines = args.items.map(
    (it) =>
      `- id: ${JSON.stringify(it.id)} | file: ${JSON.stringify(it.basename)}` +
      (it.title ? ` | current_title: ${JSON.stringify(it.title)}` : "")
  )

  const ctxBlock = args.context?.trim()
    ? `\nChannel / series context (follow tone and topics):\n${args.context.trim().slice(0, 2000)}\n`
    : ""

  const prompt = `You help YouTube creators draft upload metadata. For each item below, propose a compelling YouTube title (max 100 chars), a description (max 5000 chars, plain text, no HTML), and optional comma-separated tags (max 500 chars total).
${ctxBlock}
Items:
${lines.join("\n")}

Rules:
- Return ONLY valid JSON, no markdown, no commentary.
- JSON shape: {"suggestions":[{"id":"same as input id","title":"...","description":"...","tags":"tag1, tag2"}]}
- You MUST include one suggestion per input id, same id strings.
- Titles must be unique when possible; avoid clickbait that violates YouTube policies.
- Descriptions can mention the video topic inferred from the filename.`

  const result = await raceTimeout(model.generateContent(prompt), GEMINI_TIMEOUT_MS)
  const text = result.response.text()
  const parsed = parseBulkMetadataResponse(text)
  return parsed.suggestions
}

export type ReplyAssistMode = "shorten" | "expand" | "friendly" | "formal"

export async function generateReplyAssist(args: {
  apiKey: string
  text: string
  mode: ReplyAssistMode
}): Promise<string> {
  const key = args.apiKey.trim()
  if (!key) throw new Error("Gemini API key is missing")

  const genAI = new GoogleGenerativeAI(key)
  const model = genAI.getGenerativeModel({ model: getModelName() })

  const modeHint: Record<ReplyAssistMode, string> = {
    shorten: "Make it shorter while keeping the meaning and a polite tone.",
    expand: "Expand slightly with a warm, helpful tone; stay relevant.",
    friendly: "Rewrite in a friendly, conversational tone.",
    formal: "Rewrite in a concise, professional tone.",
  }

  const prompt = `You polish short text for a YouTube comment reply (plain text only, no markdown).
${modeHint[args.mode]}

Input:
${args.text.slice(0, 8000)}

Return ONLY valid JSON: {"text":"your polished reply"}`

  const result = await raceTimeout(model.generateContent(prompt), GEMINI_TIMEOUT_MS)
  const parsed = parseReplyAssistResponse(result.response.text())
  return parsed.text
}
