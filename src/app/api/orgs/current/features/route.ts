import { z } from "zod"
import { httpStatusFromError, jsonError } from "@/lib/api-response"
import { logApiError } from "@/lib/logger"
import {
  requireOrgOwner,
  requireOrgRead,
} from "@/lib/api-org-context"
import {
  getOrgFeatureSnapshot,
  ORG_FEATURE_AI,
  ORG_FEATURE_EXPORTS,
  ORG_FEATURE_YOUTUBE_WRITES,
  upsertOrgFeature,
} from "@/lib/features"
import { writeAuditLog } from "@/lib/audit-log"

const patchSchema = z.object({
  exports: z.boolean().optional(),
  youtube_writes: z.boolean().optional(),
  ai_features: z.boolean().optional(),
})

export async function GET() {
  try {
    const ctx = await requireOrgRead()
    if (ctx instanceof Response) return ctx

    const features = await getOrgFeatureSnapshot(ctx.organizationId)
    return Response.json(features)
  } catch (error: unknown) {
    logApiError("GET /api/orgs/current/features", error)
    return jsonError(
      error instanceof Error ? error.message : "Failed to load features",
      httpStatusFromError(error)
    )
  }
}

export async function PATCH(req: Request) {
  try {
    const ctx = await requireOrgOwner()
    if (ctx instanceof Response) return ctx

    const json: unknown = await req.json()
    const parsed = patchSchema.safeParse(json)
    if (!parsed.success) {
      return jsonError("Invalid body", 400, "validation_error")
    }
    if (
      parsed.data.exports === undefined &&
      parsed.data.youtube_writes === undefined &&
      parsed.data.ai_features === undefined
    ) {
      return jsonError("No feature keys to update", 400, "validation_error")
    }

    if (parsed.data.exports !== undefined) {
      await upsertOrgFeature(
        ctx.organizationId,
        ORG_FEATURE_EXPORTS,
        parsed.data.exports
      )
    }
    if (parsed.data.youtube_writes !== undefined) {
      await upsertOrgFeature(
        ctx.organizationId,
        ORG_FEATURE_YOUTUBE_WRITES,
        parsed.data.youtube_writes
      )
    }
    if (parsed.data.ai_features !== undefined) {
      await upsertOrgFeature(
        ctx.organizationId,
        ORG_FEATURE_AI,
        parsed.data.ai_features
      )
    }

    await writeAuditLog({
      organizationId: ctx.organizationId,
      userId: ctx.userId,
      action: "feature_flags_updated",
      entity: "OrgFeatureFlag",
      metadata: { patch: parsed.data },
    })

    const features = await getOrgFeatureSnapshot(ctx.organizationId)
    return Response.json(features)
  } catch (error: unknown) {
    logApiError("PATCH /api/orgs/current/features", error)
    return jsonError(
      error instanceof Error ? error.message : "Failed to update features",
      httpStatusFromError(error)
    )
  }
}
