import { httpStatusFromError, jsonError } from "@/lib/api-response"
import { logApiError } from "@/lib/logger"
import { requireOrgRead } from "@/lib/api-org-context"
import { getAiStatusForUser } from "@/lib/ai-guard"

export async function GET() {
  try {
    const ctx = await requireOrgRead()
    if (ctx instanceof Response) return ctx

    const status = await getAiStatusForUser(ctx.organizationId, ctx.userId)
    return Response.json(status)
  } catch (error: unknown) {
    logApiError("GET /api/orgs/current/ai-status", error)
    return jsonError(
      error instanceof Error ? error.message : "Failed to load AI status",
      httpStatusFromError(error)
    )
  }
}
