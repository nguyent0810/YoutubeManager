import { z } from "zod"
import { prisma } from "@/lib/db"
import { httpStatusFromError, jsonError } from "@/lib/api-response"
import { logApiError } from "@/lib/logger"
import {
  dbUnavailable,
  requireAuthedUser,
} from "@/lib/api-org-context"
import { ensurePersonalOrganization } from "@/lib/org"
import { writeAuditLog } from "@/lib/audit-log"

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

    return Response.json({
      organizations: memberships.map((m) => ({
        id: m.organization.id,
        name: m.organization.name,
        role: m.role,
      })),
    })
  } catch (error: unknown) {
    logApiError("GET /api/orgs", error)
    return jsonError(
      error instanceof Error ? error.message : "Failed to list organizations",
      httpStatusFromError(error)
    )
  }
}

const createSchema = z.object({
  name: z.string().min(1).max(120),
})

export async function POST(req: Request) {
  try {
    const u = await requireAuthedUser()
    if (u instanceof Response) return u
    if (!process.env.DATABASE_URL) return dbUnavailable()

    const json: unknown = await req.json()
    const parsed = createSchema.safeParse(json)
    if (!parsed.success) {
      return jsonError("Invalid body", 400, "validation_error")
    }

    const org = await prisma.organization.create({
      data: {
        name: parsed.data.name.trim(),
        members: { create: { userId: u.userId, role: "OWNER" } },
      },
    })

    await writeAuditLog({
      organizationId: org.id,
      userId: u.userId,
      action: "workspace_created",
      entity: "Organization",
      metadata: { name: org.name },
    })

    return Response.json({
      id: org.id,
      name: org.name,
      role: "OWNER" as const,
    })
  } catch (error: unknown) {
    logApiError("POST /api/orgs", error)
    return jsonError(
      error instanceof Error ? error.message : "Failed to create organization",
      httpStatusFromError(error)
    )
  }
}
