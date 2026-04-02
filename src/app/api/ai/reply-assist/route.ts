import { z } from "zod"
import { assertAiAllowed } from "@/lib/ai-guard"
import { requireOrgRead } from "@/lib/api-org-context"
import { httpStatusFromError, jsonError } from "@/lib/api-response"
import { writeAuditLog } from "@/lib/audit-log"
import { generateReplyAssist } from "@/lib/gemini"
import { logApiError } from "@/lib/logger"

const bodySchema = z.object({
  text: z.string().min(1).max(8000),
  mode: z.enum(["shorten", "expand", "friendly", "formal"]),
})

export async function POST(req: Request): Promise<Response> {
  try {
    const ctx = await requireOrgRead()
    if (ctx instanceof Response) return ctx

    const gate = await assertAiAllowed(ctx.organizationId, ctx.userId)
    if (gate instanceof Response) return gate

    const json: unknown = await req.json()
    const parsed = bodySchema.safeParse(json)
    if (!parsed.success) {
      return jsonError("Invalid body", 400, "validation_error")
    }

    const text = await generateReplyAssist({
      apiKey: gate.apiKey,
      text: parsed.data.text,
      mode: parsed.data.mode,
    })

    await writeAuditLog({
      organizationId: ctx.organizationId,
      userId: ctx.userId,
      action: "ai_feature_used",
      entity: "Gemini",
      metadata: { route: "reply-assist", mode: parsed.data.mode },
    })

    return Response.json({ text })
  } catch (error: unknown) {
    logApiError("POST /api/ai/reply-assist", error)
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
