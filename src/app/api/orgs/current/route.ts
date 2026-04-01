import { prisma } from "@/lib/db"
import { httpStatusFromError, jsonError } from "@/lib/api-response"
import { logApiError } from "@/lib/logger"
import {
  dbUnavailable,
  requireAuthedUser,
} from "@/lib/api-org-context"
import { ensurePersonalOrganization, getActiveOrganizationId } from "@/lib/org"

export async function GET() {
  try {
    const u = await requireAuthedUser()
    if (u instanceof Response) return u
    if (!process.env.DATABASE_URL) return dbUnavailable()

    await ensurePersonalOrganization(u.userId, u.email)

    const memberships = await prisma.organizationMember.findMany({
      where: { userId: u.userId },
      include: { organization: true },
      orderBy: { createdAt: "asc" },
    })

    const activeOrganizationId = await getActiveOrganizationId(u.userId, u.email)
    const activeMembership = memberships.find(
      (m) => m.organizationId === activeOrganizationId
    )

    return Response.json({
      activeOrganizationId,
      activeRole: activeMembership?.role ?? null,
      organizations: memberships.map((m) => ({
        id: m.organization.id,
        name: m.organization.name,
        role: m.role,
      })),
    })
  } catch (error: unknown) {
    logApiError("GET /api/orgs/current", error)
    return jsonError(
      error instanceof Error ? error.message : "Failed to load workspace",
      httpStatusFromError(error)
    )
  }
}
