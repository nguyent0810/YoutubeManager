import { z } from "zod"
import { prisma } from "@/lib/db"
import { httpStatusFromError, jsonError } from "@/lib/api-response"
import { logApiError } from "@/lib/logger"
import { requireOrgRead } from "@/lib/api-org-context"

const patchSchema = z.object({
  optIn: z.boolean(),
})

export async function PATCH(req: Request) {
  try {
    const ctx = await requireOrgRead()
    if (ctx instanceof Response) return ctx

    const json: unknown = await req.json()
    const parsed = patchSchema.safeParse(json)
    if (!parsed.success) {
      return jsonError("Invalid body", 400, "validation_error")
    }

    const updated = await prisma.organizationMember.updateMany({
      where: {
        organizationId: ctx.organizationId,
        userId: ctx.userId,
      },
      data: { aiOptIn: parsed.data.optIn },
    })

    if (updated.count === 0) {
      return jsonError("Membership not found", 404)
    }

    return Response.json({ ok: true, optIn: parsed.data.optIn })
  } catch (error: unknown) {
    logApiError("PATCH /api/orgs/current/ai-preference", error)
    return jsonError(
      error instanceof Error ? error.message : "Failed to update preference",
      httpStatusFromError(error)
    )
  }
}
