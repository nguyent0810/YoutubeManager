import { z } from "zod"
import { prisma } from "@/lib/db"
import { httpStatusFromError, jsonError } from "@/lib/api-response"
import { logApiError } from "@/lib/logger"
import { requireOrgAdmin } from "@/lib/api-org-context"

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).optional().default(50),
})

export async function GET(req: Request) {
  try {
    const ctx = await requireOrgAdmin()
    if (ctx instanceof Response) return ctx

    const url = new URL(req.url)
    const parsed = querySchema.safeParse({
      limit: url.searchParams.get("limit") ?? undefined,
    })
    if (!parsed.success) {
      return jsonError("Invalid query", 400, "validation_error")
    }

    const logs = await prisma.auditLog.findMany({
      where: { organizationId: ctx.organizationId },
      orderBy: { createdAt: "desc" },
      take: parsed.data.limit,
    })

    return Response.json({
      logs: logs.map((l) => ({
        id: l.id,
        userId: l.userId,
        action: l.action,
        entity: l.entity,
        metadata: l.metadata,
        createdAt: l.createdAt.toISOString(),
      })),
    })
  } catch (error: unknown) {
    logApiError("GET /api/orgs/current/audit-logs", error)
    return jsonError(
      error instanceof Error ? error.message : "Failed to load audit log",
      httpStatusFromError(error)
    )
  }
}
