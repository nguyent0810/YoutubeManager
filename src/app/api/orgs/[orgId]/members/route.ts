import { prisma } from "@/lib/db"
import { httpStatusFromError, jsonError } from "@/lib/api-response"
import { logApiError } from "@/lib/logger"
import { requireAuthedMemberOfOrg } from "@/lib/api-org-context"

export async function GET(
  _req: Request,
  context: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await context.params
    if (!orgId) return jsonError("Missing organization id", 400)

    const base = await requireAuthedMemberOfOrg(orgId)
    if (base instanceof Response) return base

    const members = await prisma.organizationMember.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "asc" },
    })

    return Response.json({
      members: members.map((m) => ({
        id: m.id,
        userId: m.userId,
        role: m.role,
        createdAt: m.createdAt.toISOString(),
      })),
    })
  } catch (error: unknown) {
    logApiError("GET /api/orgs/[orgId]/members", error)
    return jsonError(
      error instanceof Error ? error.message : "Failed to list members",
      httpStatusFromError(error)
    )
  }
}
