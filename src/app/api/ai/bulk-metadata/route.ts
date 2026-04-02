import { z } from "zod"
import { assertAiAllowed } from "@/lib/ai-guard"
import { requireOrgWrite } from "@/lib/api-org-context"
import { httpStatusFromError, jsonError } from "@/lib/api-response"
import { writeAuditLog } from "@/lib/audit-log"
import {
  generateBulkMetadataSuggestions,
  MAX_BULK_METADATA_ITEMS,
} from "@/lib/gemini"
import { logApiError } from "@/lib/logger"

const itemSchema = z.object({
  id: z.string().min(1).max(128),
  basename: z.string().min(1).max(260),
  title: z.string().max(100).optional(),
})

const bodySchema = z.object({
  context: z.string().max(2000).optional(),
  items: z.array(itemSchema).min(1).max(MAX_BULK_METADATA_ITEMS),
})

export async function POST(req: Request) {
  try {
    const ctx = await requireOrgWrite()
    if (ctx instanceof Response) return ctx

    const blocked = await assertAiAllowed(ctx.organizationId, ctx.userId)
    if (blocked) return blocked

    const json: unknown = await req.json()
    const parsed = bodySchema.safeParse(json)
    if (!parsed.success) {
      return jsonError("Invalid body", 400, "validation_error")
    }

    const suggestions = await generateBulkMetadataSuggestions({
      items: parsed.data.items,
      context: parsed.data.context,
    })

    const byId = new Map(suggestions.map((s) => [s.id, s]))
    const ordered: typeof suggestions = []
    for (const it of parsed.data.items) {
      const s = byId.get(it.id)
      if (!s) {
        return jsonError(
          "AI response did not include all requested ids. Try again with a smaller batch.",
          502,
          "ai_invalid_response"
        )
      }
      ordered.push(s)
    }

    await writeAuditLog({
      organizationId: ctx.organizationId,
      userId: ctx.userId,
      action: "ai_feature_used",
      entity: "Gemini",
      metadata: {
        route: "bulk-metadata",
        itemCount: parsed.data.items.length,
      },
    })

    return Response.json({ suggestions: ordered })
  } catch (error: unknown) {
    logApiError("POST /api/ai/bulk-metadata", error)
    const msg = error instanceof Error ? error.message : "AI request failed"
    if (/429|resource.exhausted|quota/i.test(msg)) {
      return jsonError(
        "Gemini rate limit or quota exceeded. Try again later.",
        429,
        "ai_rate_limited"
      )
    }
    if (error instanceof z.ZodError) {
      return jsonError("AI returned invalid JSON.", 502, "ai_invalid_response")
    }
    if (msg.includes("JSON")) {
      return jsonError("AI returned invalid JSON.", 502, "ai_invalid_response")
    }
    return jsonError(msg, httpStatusFromError(error))
  }
}
